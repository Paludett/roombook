package dev.paludett.roombook.dto;

import dev.paludett.roombook.domain.RoomStatus;
import jakarta.validation.constraints.NotNull;

public record RoomStatusRequest(@NotNull RoomStatus status) {
}
