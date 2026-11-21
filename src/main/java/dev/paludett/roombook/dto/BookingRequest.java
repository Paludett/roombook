package dev.paludett.roombook.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/** Entrada de POST /bookings. blockedUntil nunca vem do cliente. */
public record BookingRequest(
		@NotNull Long roomId,
		@NotNull Long professionalId,
		@NotNull Instant startTime,
		@NotNull Instant endTime,
		@NotBlank @Size(max = 255) String purpose) {
}
