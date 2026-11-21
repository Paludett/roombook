package dev.paludett.roombook.repository;

import dev.paludett.roombook.domain.Room;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {
}
