package dev.paludett.roombook.dto;

import dev.paludett.roombook.domain.Room;
import dev.paludett.roombook.domain.RoomStatus;
import dev.paludett.roombook.domain.RoomType;

public record RoomResponse(Long id, String name, RoomType type, String floorWing, RoomStatus status,
		int sanitizationMinutes) {

	public static RoomResponse from(Room r) {
		return new RoomResponse(r.getId(), r.getName(), r.getType(), r.getFloorWing(), r.getStatus(),
				r.getSanitizationMinutes());
	}
}
