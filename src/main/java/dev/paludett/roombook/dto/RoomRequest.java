package dev.paludett.roombook.dto;

import dev.paludett.roombook.domain.RoomType;
import jakarta.validation.constraints.*;

/** Entrada de POST/PUT /rooms. sanitizationMinutes nulo = padrão do tipo. */
public record RoomRequest(
		@NotBlank @Size(max = 100) String name,
		@NotNull RoomType type,
		@NotBlank @Size(max = 100) String floorWing,
		@PositiveOrZero @Max(480) Integer sanitizationMinutes) {
}
