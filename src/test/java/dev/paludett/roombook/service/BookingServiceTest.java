package dev.paludett.roombook.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import dev.paludett.roombook.config.BookingProperties;
import dev.paludett.roombook.domain.Professional;
import dev.paludett.roombook.domain.Room;
import dev.paludett.roombook.domain.RoomStatus;
import dev.paludett.roombook.dto.BookingRequest;
import dev.paludett.roombook.exception.BusinessRuleException;
import dev.paludett.roombook.exception.InvalidRequestException;
import dev.paludett.roombook.exception.NotFoundException;
import dev.paludett.roombook.repository.BookingRepository;
import dev.paludett.roombook.repository.ProfessionalRepository;
import dev.paludett.roombook.repository.RoomRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class BookingServiceTest {

	// "agora" = 2030-01-01 10:00 -03:00
	static final Clock NOW = Clock.fixed(Instant.parse("2030-01-01T13:00:00Z"), ZoneId.of("UTC"));

	final BookingRepository bookings = mock(BookingRepository.class);
	final RoomRepository rooms = mock(RoomRepository.class);
	final ProfessionalRepository pros = mock(ProfessionalRepository.class);
	final BookingService service = new BookingService(bookings, rooms, pros,
			new BookingProperties(null, null, null), NOW);
	final Room room = new Room();

	BookingServiceTest() {
		room.setSanitizationMinutes(20);
		when(rooms.findById(1L)).thenReturn(Optional.of(room));
		when(pros.findById(1L)).thenReturn(Optional.of(new Professional()));
		when(bookings.save(any())).thenAnswer(i -> i.getArgument(0));
	}

	BookingRequest req(String startUtc, String endUtc, String purpose) {
		return new BookingRequest(1L, 1L, Instant.parse(startUtc), Instant.parse(endUtc), purpose);
	}

	@Test
	void createsConfirmedWithBlockedUntil() {
		// 11:00-12:30 -03:00
		var r = service.create(req("2030-01-02T14:00:00Z", "2030-01-02T15:30:00Z", " Consulta "));
		assertThat(r.status().name()).isEqualTo("CONFIRMED");
		assertThat(r.purpose()).isEqualTo("Consulta");
		assertThat(r.blockedUntil()).isEqualTo(Instant.parse("2030-01-02T15:50:00Z"));
	}

	@Test
	void rejectsInvalidInput() {
		// desalinhado
		assertThatThrownBy(() -> service.create(req("2030-01-02T14:10:00Z", "2030-01-02T15:30:00Z", "x")))
				.isInstanceOf(InvalidRequestException.class);
		// fim <= início
		assertThatThrownBy(() -> service.create(req("2030-01-02T14:00:00Z", "2030-01-02T14:00:00Z", "x")))
				.isInstanceOf(InvalidRequestException.class);
		// passado
		assertThatThrownBy(() -> service.create(req("2029-12-31T14:00:00Z", "2029-12-31T15:00:00Z", "x")))
				.isInstanceOf(InvalidRequestException.class).hasMessageContaining("passado");
		// antes das 07:00 (06:30 -03:00)
		assertThatThrownBy(() -> service.create(req("2030-01-02T09:30:00Z", "2030-01-02T10:30:00Z", "x")))
				.isInstanceOf(InvalidRequestException.class).hasMessageContaining("funcionamento");
		// termina depois das 22:00 (22:30 -03:00)
		assertThatThrownBy(() -> service.create(req("2030-01-03T00:00:00Z", "2030-01-03T01:30:00Z", "x")))
				.isInstanceOf(InvalidRequestException.class).hasMessageContaining("funcionamento");
		// finalidade em branco
		assertThatThrownBy(() -> service.create(req("2030-01-02T14:00:00Z", "2030-01-02T15:00:00Z", "  ")))
				.isInstanceOf(InvalidRequestException.class);
	}

	@Test
	void rejectsOverlap() {
		// bloqueio = fim + 20min de higienização
		when(bookings.existsOverlap(any(), any(), any())).thenReturn(true);
		assertThatThrownBy(() -> service.create(req("2030-01-02T14:00:00Z", "2030-01-02T15:00:00Z", "x")))
				.isInstanceOf(BusinessRuleException.class).hasMessageContaining("reservada");
	}

	@Test
	void overlapQueryReceivesBlockedUntil() {
		service.create(req("2030-01-02T14:00:00Z", "2030-01-02T15:00:00Z", "x"));
		org.mockito.Mockito.verify(bookings).existsOverlap(any(),
				org.mockito.ArgumentMatchers.eq(Instant.parse("2030-01-02T14:00:00Z")),
				org.mockito.ArgumentMatchers.eq(Instant.parse("2030-01-02T15:20:00Z")));
	}

	@Test
	void allowsEndingExactlyAtClosing() {
		// 21:00-22:00 -03:00
		service.create(req("2030-01-03T00:00:00Z", "2030-01-03T01:00:00Z", "x"));
	}

	@Test
	void roomNotActiveOrMissing() {
		room.setStatus(RoomStatus.EM_MANUTENCAO);
		assertThatThrownBy(() -> service.create(req("2030-01-02T14:00:00Z", "2030-01-02T15:00:00Z", "x")))
				.isInstanceOf(BusinessRuleException.class);
		assertThatThrownBy(() -> service.create(new BookingRequest(9L, 1L,
				Instant.parse("2030-01-02T14:00:00Z"), Instant.parse("2030-01-02T15:00:00Z"), "x")))
				.isInstanceOf(NotFoundException.class);
	}
}
