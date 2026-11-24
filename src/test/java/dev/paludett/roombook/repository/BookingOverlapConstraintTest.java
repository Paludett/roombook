package dev.paludett.roombook.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import dev.paludett.roombook.domain.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/** Prova ex_bookings_no_overlap no Postgres real, sem passar pela checagem do service. */
@SpringBootTest
@Testcontainers
class BookingOverlapConstraintTest {

	@Container
	static final PostgreSQLContainer PG = new PostgreSQLContainer("postgres:16");

	@DynamicPropertySource
	static void db(DynamicPropertyRegistry r) {
		r.add("spring.datasource.url", PG::getJdbcUrl);
		r.add("spring.datasource.username", PG::getUsername);
		r.add("spring.datasource.password", PG::getPassword);
	}

	@Autowired RoomRepository rooms;
	@Autowired ProfessionalRepository professionals;
	@Autowired BookingRepository bookings;

	// 1h de reserva + 10min de higienização
	static final Instant T0 = Instant.now().plus(30, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);

	Room room() {
		Room r = new Room();
		r.setName("Sala " + UUID.randomUUID());
		r.setType(RoomType.CONSULTORIO);
		r.setFloorWing("2A");
		return rooms.saveAndFlush(r);
	}

	Professional professional() {
		Professional p = new Professional();
		p.setName("Dra. Teste");
		p.setLicenseNumber("CRM-" + UUID.randomUUID());
		p.setSpecialty("Clínica");
		p.setEmail(UUID.randomUUID() + "@exemplo.test");
		return professionals.saveAndFlush(p);
	}

	Booking booking(Room r, Professional p, Instant start) {
		Booking b = new Booking();
		b.setRoom(r);
		b.setProfessional(p);
		b.setStartTime(start);
		b.setEndTime(start.plus(1, ChronoUnit.HOURS));
		b.setBlockedUntil(start.plus(70, ChronoUnit.MINUTES));
		b.setPurpose("Consulta");
		return b;
	}

	@Test
	void startInsideCleaningWindowIsRejected() {
		Room r = room();
		Professional p = professional();
		bookings.saveAndFlush(booking(r, p, T0));
		Booking inside = booking(r, p, T0.plus(65, ChronoUnit.MINUTES));
		assertThatThrownBy(() -> bookings.saveAndFlush(inside))
				.isInstanceOf(DataIntegrityViolationException.class)
				.hasMessageContaining("ex_bookings_no_overlap");
	}

	@Test
	void startExactlyAtBlockedUntilIsAccepted() {
		Room r = room();
		Professional p = professional();
		Booking first = bookings.saveAndFlush(booking(r, p, T0));
		Booking next = bookings.saveAndFlush(booking(r, p, first.getBlockedUntil()));
		assertThat(next.getId()).isNotNull();
	}

	@Test
	void otherRoomSameTimeIsAccepted() {
		Professional p = professional();
		bookings.saveAndFlush(booking(room(), p, T0));
		assertThat(bookings.saveAndFlush(booking(room(), p, T0)).getId()).isNotNull();
	}

	@Test
	void cancelledBookingDoesNotBlock() {
		Room r = room();
		Professional p = professional();
		Booking first = bookings.saveAndFlush(booking(r, p, T0));
		first.cancel(Instant.EPOCH);
		bookings.saveAndFlush(first);
		assertThat(bookings.saveAndFlush(booking(r, p, T0)).getId()).isNotNull();
	}

	@Test
	void concurrentSameSlotOnlyOneWins() throws Exception {
		Room r = room();
		Professional p = professional();
		int n = 8;
		CountDownLatch go = new CountDownLatch(1);
		ExecutorService ex = Executors.newFixedThreadPool(n);
		try {
			List<Future<Boolean>> res = new java.util.ArrayList<>();
			for (int i = 0; i < n; i++) {
				res.add(ex.submit(() -> {
					go.await();
					try {
						bookings.saveAndFlush(booking(r, p, T0));
						return true;
					} catch (DataIntegrityViolationException e) {
						return false;
					}
				}));
			}
			go.countDown();
			long ok = 0;
			for (Future<Boolean> f : res) if (f.get(30, TimeUnit.SECONDS)) ok++;
			assertThat(ok).isEqualTo(1);
		} finally {
			ex.shutdownNow();
		}
	}
}
