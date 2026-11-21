package dev.paludett.roombook.dto;

import dev.paludett.roombook.domain.Booking;
import dev.paludett.roombook.domain.BookingStatus;
import java.time.Instant;

public record BookingResponse(Long id, Long roomId, Long professionalId, Instant startTime, Instant endTime,
		Instant blockedUntil, String purpose, BookingStatus status) {

	public static BookingResponse from(Booking b) {
		return new BookingResponse(b.getId(), b.getRoom().getId(), b.getProfessional().getId(),
				b.getStartTime(), b.getEndTime(), b.getBlockedUntil(), b.getPurpose(), b.getStatus());
	}
}
