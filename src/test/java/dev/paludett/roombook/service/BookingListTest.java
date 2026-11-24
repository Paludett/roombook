package dev.paludett.roombook.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import dev.paludett.roombook.domain.*;
import dev.paludett.roombook.dto.BookingResponse;
import dev.paludett.roombook.exception.InvalidRequestException;
import dev.paludett.roombook.repository.BookingRepository;
import dev.paludett.roombook.repository.ProfessionalRepository;
import dev.paludett.roombook.repository.RoomRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

/**
 * Listagem de reservas (#12). Cada teste cria a própria sala/profissionais e filtra por eles,
 * então não depende do que já existe no banco.
 */
@SpringBootTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
@Transactional
class BookingListTest {

	static final ZoneId SP = ZoneId.of("America/Sao_Paulo");

	@Autowired BookingService service;
	@Autowired BookingRepository bookings;
	@Autowired RoomRepository rooms;
	@Autowired ProfessionalRepository professionals;
	@Autowired EntityManager em;
	@Autowired EntityManagerFactory emf;

	Room room;
	List<Professional> pros = new ArrayList<>();
	List<Booking> created = new ArrayList<>();

	@BeforeEach
	void setUp() {
		room = new Room();
		room.setName("Sala N+1 " + UUID.randomUUID());
		room.setType(RoomType.CONSULTORIO);
		room.setFloorWing("T");
		room = rooms.saveAndFlush(room);
		// 5 profissionais distintos: com N+1 cada linha dispararia um SELECT extra.
		for (int i = 0; i < 5; i++) {
			Professional p = new Professional();
			p.setName("Prof " + i);
			p.setLicenseNumber("T-" + UUID.randomUUID());
			p.setSpecialty("X");
			p.setEmail(UUID.randomUUID() + "@exemplo.test");
			pros.add(professionals.saveAndFlush(p));
		}
		// Um por dia, em dias bem distantes do uso real (sem colidir com a sala própria).
		LocalDate base = LocalDate.of(2090, 1, 1);
		for (int i = 0; i < 5; i++) {
			created.add(book(pros.get(i), base.plusDays(i).atTime(10, 0).atZone(SP).toInstant()));
		}
		em.flush();
		em.clear(); // sem isso as entidades já estariam no contexto e o N+1 ficaria escondido
	}

	Booking book(Professional p, Instant start) {
		Booking b = new Booking();
		b.setRoom(room);
		b.setProfessional(p);
		b.setStartTime(start);
		b.setEndTime(start.plusSeconds(3600));
		b.setBlockedUntil(start.plusSeconds(4200));
		b.setPurpose("Teste");
		return bookings.saveAndFlush(b);
	}

	List<BookingResponse> list(Long roomId, Long proId, String date, String status) {
		return service.list(roomId, proId, date, status, PageRequest.of(0, 20, Sort.by("startTime"))).getContent();
	}

	@Test
	void listaSemNMaisUm() {
		Statistics stats = emf.unwrap(SessionFactory.class).getStatistics();
		stats.clear();
		var page = service.list(room.getId(), null, null, null, PageRequest.of(0, 20, Sort.by("startTime")));
		assertThat(page.getContent()).hasSize(5);
		assertThat(page.getContent()).allSatisfy(r -> {
			assertThat(r.roomName()).startsWith("Sala N+1");
			assertThat(r.professionalName()).startsWith("Prof ");
		});
		// 1 SELECT da página (com JOIN de sala e profissional) + 1 COUNT. Com N+1 seriam 1 + 1 + 5 (+1 sala).
		assertThat(stats.getPrepareStatementCount()).as("statements").isLessThanOrEqualTo(2);
	}

	@Test
	void filtraPorProfissionalDataEStatus() {
		Long roomId = room.getId();
		assertThat(list(roomId, pros.get(2).getId(), null, null)).extracting(BookingResponse::id)
				.containsExactly(created.get(2).getId());
		assertThat(list(roomId, null, "2090-01-02", null)).extracting(BookingResponse::id)
				.containsExactly(created.get(1).getId());
		assertThat(list(roomId, null, null, "cancelled")).isEmpty();
		assertThat(list(roomId, null, null, "CONFIRMED")).hasSize(5);
		assertThat(list(-1L, null, null, null)).isEmpty();
	}

	@Test
	void dataUsaOFusoDaReserva() {
		// 23:30 local de 2090-02-01 já é 02:30Z do dia 02: pertence ao dia 01 no fuso da clínica.
		Booking late = book(pros.get(0), LocalDate.of(2090, 2, 1).atTime(21, 0).atZone(SP).toInstant());
		assertThat(list(room.getId(), null, "2090-02-01", null)).extracting(BookingResponse::id)
				.containsExactly(late.getId());
		assertThat(list(room.getId(), null, "2090-02-02", null)).isEmpty();
	}

	@Test
	void ordenaPorInicioEPagina() {
		var p1 = service.list(room.getId(), null, null, null, PageRequest.of(1, 2, Sort.by("startTime")));
		assertThat(p1.getTotalElements()).isEqualTo(5);
		assertThat(p1.getContent()).extracting(BookingResponse::id)
				.containsExactly(created.get(2).getId(), created.get(3).getId());
		var desc = service.list(room.getId(), null, null, null, PageRequest.of(0, 1, Sort.by("startTime").descending()));
		assertThat(desc.getContent().get(0).id()).isEqualTo(created.get(4).getId());
	}

	@Test
	void rejeitaParametrosInvalidos() {
		var pg = PageRequest.of(0, 5);
		assertThatThrownBy(() -> service.list(null, null, "ontem", null, pg))
				.isInstanceOf(InvalidRequestException.class).hasMessageContaining("Data inválida");
		assertThatThrownBy(() -> service.list(null, null, null, "XYZ", pg))
				.isInstanceOf(InvalidRequestException.class).hasMessageContaining("Status inválido");
		assertThatThrownBy(() -> service.list(null, null, null, null, PageRequest.of(0, 5, Sort.by("room.name"))))
				.isInstanceOf(InvalidRequestException.class).hasMessageContaining("ordenação inválido");
	}
}
