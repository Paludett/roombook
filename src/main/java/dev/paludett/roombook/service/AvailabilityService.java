package dev.paludett.roombook.service;

import dev.paludett.roombook.config.BookingProperties;
import dev.paludett.roombook.domain.Booking;
import dev.paludett.roombook.domain.Room;
import dev.paludett.roombook.domain.RoomStatus;
import dev.paludett.roombook.dto.AvailabilityBlock;
import dev.paludett.roombook.dto.AvailabilityBlock.State;
import dev.paludett.roombook.dto.AvailabilityResponse;
import dev.paludett.roombook.exception.InvalidRequestException;
import dev.paludett.roombook.exception.NotFoundException;
import dev.paludett.roombook.repository.BookingRepository;
import dev.paludett.roombook.repository.RoomRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AvailabilityService {

	private static final Duration BLOCK = Duration.ofMinutes(30);

	private final RoomRepository rooms;
	private final BookingRepository bookings;
	private final BookingProperties props;
	private final Clock clock;

	public AvailabilityService(RoomRepository rooms, BookingRepository bookings, BookingProperties props,
			Clock clock) {
		this.rooms = rooms;
		this.bookings = bookings;
		this.props = props;
		this.clock = clock;
	}

	public AvailabilityResponse availability(Long roomId, String dateParam) {
		Room room = rooms.findById(roomId)
				.orElseThrow(() -> new NotFoundException("Sala não encontrada: " + roomId));
		LocalDate date = parse(dateParam);

		Instant open = date.atTime(props.opening()).atZone(props.zone()).toInstant();
		Instant close = date.atTime(props.closing()).atZone(props.zone()).toInstant();
		Instant now = clock.instant();
		boolean roomOff = room.getStatus() != RoomStatus.ATIVA;
		// Uma única consulta para o dia (sem consulta por bloco).
		List<Booking> day = roomOff ? List.of() : bookings.findActiveInWindow(roomId, open, close);

		List<AvailabilityBlock> blocks = new ArrayList<>();
		for (Instant s = open; s.isBefore(close); s = s.plus(BLOCK)) {
			Instant e = s.plus(BLOCK);
			blocks.add(new AvailabilityBlock(s, e, roomOff || s.isBefore(now) ? State.UNAVAILABLE : stateOf(day, s, e)));
		}
		return new AvailabilityResponse(roomId, date, blocks);
	}

	private static State stateOf(List<Booking> day, Instant s, Instant e) {
		State state = State.FREE;
		for (Booking b : day) {
			if (b.getStartTime().isBefore(e) && b.getEndTime().isAfter(s)) return State.BOOKED;
			if (b.getEndTime().isBefore(e) && b.getBlockedUntil().isAfter(s)) state = State.CLEANING;
		}
		return state;
	}

	private static LocalDate parse(String date) {
		if (date == null || date.isBlank()) {
			throw new InvalidRequestException("O parâmetro 'date' é obrigatório (AAAA-MM-DD)");
		}
		try {
			return LocalDate.parse(date);
		} catch (DateTimeParseException ex) {
			throw new InvalidRequestException("Data inválida: '" + date + "' (use AAAA-MM-DD)");
		}
	}
}
