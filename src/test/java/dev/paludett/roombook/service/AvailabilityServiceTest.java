package dev.paludett.roombook.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.paludett.roombook.config.BookingProperties;
import dev.paludett.roombook.domain.Booking;
import dev.paludett.roombook.domain.Room;
import dev.paludett.roombook.domain.RoomStatus;
import dev.paludett.roombook.dto.AvailabilityBlock;
import dev.paludett.roombook.dto.AvailabilityBlock.State;
import dev.paludett.roombook.exception.InvalidRequestException;
import dev.paludett.roombook.exception.NotFoundException;
import dev.paludett.roombook.repository.BookingRepository;
import dev.paludett.roombook.repository.RoomRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

/** Sem banco: repositórios simulados e relógio fixo (2030-01-01 10:00 -03:00). */
class AvailabilityServiceTest {

	static final Clock NOW = Clock.fixed(Instant.parse("2030-01-01T13:00:00Z"), ZoneId.of("UTC"));

	final RoomRepository rooms = mock(RoomRepository.class);
	final BookingRepository bookings = mock(BookingRepository.class);
	final AvailabilityService service = new AvailabilityService(rooms, bookings,
			new BookingProperties(null, null, null), NOW);
	final Room room = new Room();

	AvailabilityServiceTest() {
		when(rooms.findById(1L)).thenReturn(Optional.of(room));
	}

	static Booking booking(String start, String end, String blockedUntil) {
		Booking b = new Booking();
		b.setStartTime(Instant.parse(start));
		b.setEndTime(Instant.parse(end));
		b.setBlockedUntil(Instant.parse(blockedUntil));
		return b;
	}

	static State at(List<AvailabilityBlock> blocks, String startUtc) {
		return blocks.stream().filter(b -> b.start().equals(Instant.parse(startUtc))).findFirst().orElseThrow().state();
	}

	@Test
	void listsThirtyMinuteBlocksOfOpeningHours() {
		var r = service.availability(1L, "2030-01-02");
		assertThat(r.blocks()).hasSize(30); // 07:00-22:00
		assertThat(r.blocks().getFirst().start()).isEqualTo(Instant.parse("2030-01-02T10:00:00Z"));
		assertThat(r.blocks().getLast().end()).isEqualTo(Instant.parse("2030-01-03T01:00:00Z"));
		assertThat(r.blocks()).allMatch(b -> b.state() == State.FREE);
	}

	@Test
	void marksBookedAndCleaningAndUsesSingleQuery() {
		// reserva 11:00-12:00 -03:00, higienização até 12:20
		when(bookings.findActiveInWindow(eq(1L), any(), any())).thenReturn(
				List.of(booking("2030-01-02T14:00:00Z", "2030-01-02T15:00:00Z", "2030-01-02T15:20:00Z")));
		var b = service.availability(1L, "2030-01-02").blocks();
		assertThat(at(b, "2030-01-02T13:30:00Z")).isEqualTo(State.FREE);
		assertThat(at(b, "2030-01-02T14:00:00Z")).isEqualTo(State.BOOKED);
		assertThat(at(b, "2030-01-02T14:30:00Z")).isEqualTo(State.BOOKED);
		assertThat(at(b, "2030-01-02T15:00:00Z")).isEqualTo(State.CLEANING);
		assertThat(at(b, "2030-01-02T15:30:00Z")).isEqualTo(State.FREE);
		verify(bookings, times(1)).findActiveInWindow(eq(1L), any(), any());
	}

	@Test
	void inactiveOrMaintenanceRoomIsAllUnavailable() {
		for (RoomStatus s : new RoomStatus[] { RoomStatus.EM_MANUTENCAO, RoomStatus.INATIVA }) {
			room.setStatus(s);
			assertThat(service.availability(1L, "2030-01-02").blocks()).allMatch(b -> b.state() == State.UNAVAILABLE);
		}
	}

	@Test
	void pastBlocksOfTodayAreUnavailable() {
		// agora = 10:00 -03:00 = 13:00Z
		var b = service.availability(1L, "2030-01-01").blocks();
		assertThat(at(b, "2030-01-01T12:30:00Z")).isEqualTo(State.UNAVAILABLE);
		assertThat(at(b, "2030-01-01T13:00:00Z")).isEqualTo(State.FREE);
		assertThat(service.availability(1L, "2029-12-31").blocks()).allMatch(x -> x.state() == State.UNAVAILABLE);
	}

	@Test
	void rejectsMissingInvalidDateAndUnknownRoom() {
		assertThatThrownBy(() -> service.availability(1L, null)).isInstanceOf(InvalidRequestException.class);
		assertThatThrownBy(() -> service.availability(1L, "02/01/2030")).isInstanceOf(InvalidRequestException.class);
		assertThatThrownBy(() -> service.availability(9L, "2030-01-02")).isInstanceOf(NotFoundException.class);
	}
}
