package dev.paludett.roombook.service;

import dev.paludett.roombook.config.BookingProperties;
import dev.paludett.roombook.domain.Booking;
import dev.paludett.roombook.domain.BookingStatus;
import dev.paludett.roombook.domain.Room;
import dev.paludett.roombook.domain.RoomStatus;
import dev.paludett.roombook.dto.BookingRequest;
import dev.paludett.roombook.dto.BookingResponse;
import dev.paludett.roombook.exception.BusinessRuleException;
import dev.paludett.roombook.exception.InvalidRequestException;
import dev.paludett.roombook.exception.NotFoundException;
import dev.paludett.roombook.repository.BookingRepository;
import dev.paludett.roombook.repository.ProfessionalRepository;
import dev.paludett.roombook.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;

@Service
@Transactional
public class BookingService {

	public static final String OVERLAP_MESSAGE =
			"A sala já está reservada ou em higienização nesse horário";
	private static final int BLOCK_MINUTES = 30;

	private final BookingRepository bookings;
	private final RoomRepository rooms;
	private final ProfessionalRepository professionals;
	private final BookingProperties props;
	private final Clock clock;

	public BookingService(BookingRepository bookings, RoomRepository rooms,
			ProfessionalRepository professionals, BookingProperties props, Clock clock) {
		this.bookings = bookings;
		this.rooms = rooms;
		this.professionals = professionals;
		this.props = props;
		this.clock = clock;
	}

	public BookingResponse create(BookingRequest req) {
		String purpose = req.purpose().trim();
		if (purpose.isEmpty()) {
			throw new InvalidRequestException("A finalidade é obrigatória");
		}
		validateTime(req.startTime(), req.endTime());

		Room room = rooms.findById(req.roomId())
				.orElseThrow(() -> new NotFoundException("Sala não encontrada: " + req.roomId()));
		var professional = professionals.findById(req.professionalId())
				.orElseThrow(() -> new NotFoundException("Profissional não encontrado: " + req.professionalId()));
		if (room.getStatus() != RoomStatus.ATIVA) {
			throw new BusinessRuleException("A sala não aceita reservas (status " + room.getStatus() + ")");
		}

		Instant blockedUntil = req.endTime().plus(Duration.ofMinutes(room.getSanitizationMinutes()));
		if (bookings.existsOverlap(room.getId(), req.startTime(), blockedUntil)) {
			throw new BusinessRuleException(OVERLAP_MESSAGE);
		}

		Booking b = new Booking();
		b.setRoom(room);
		b.setProfessional(professional);
		b.setStartTime(req.startTime());
		b.setEndTime(req.endTime());
		b.setBlockedUntil(blockedUntil);
		b.setPurpose(purpose);
		b.setStatus(BookingStatus.CONFIRMED);
		return BookingResponse.from(bookings.save(b));
	}

	private void validateTime(Instant start, Instant end) {
		if (!end.isAfter(start)) {
			throw new InvalidRequestException("O fim deve ser posterior ao início");
		}
		ZonedDateTime s = start.atZone(props.zone());
		ZonedDateTime e = end.atZone(props.zone());
		if (!aligned(s) || !aligned(e)) {
			throw new InvalidRequestException("Início e fim devem estar alinhados a blocos de " + BLOCK_MINUTES + " minutos");
		}
		if (Duration.between(start, end).toMinutes() % BLOCK_MINUTES != 0) {
			throw new InvalidRequestException("A duração deve ser múltiplo de " + BLOCK_MINUTES + " minutos");
		}
		if (start.isBefore(clock.instant())) {
			throw new InvalidRequestException("Não é permitido reservar no passado");
		}
		if (!s.toLocalDate().equals(e.toLocalDate()) || s.toLocalTime().isBefore(props.opening())
				|| e.toLocalTime().isAfter(props.closing())) {
			throw new InvalidRequestException("A reserva deve caber no horário de funcionamento ("
					+ props.opening() + " às " + props.closing() + ")");
		}
	}

	private static boolean aligned(ZonedDateTime t) {
		return t.getMinute() % BLOCK_MINUTES == 0 && t.getSecond() == 0 && t.getNano() == 0;
	}
}
