package dev.paludett.roombook.repository;

import dev.paludett.roombook.domain.Room;
import dev.paludett.roombook.domain.RoomStatus;
import dev.paludett.roombook.domain.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {

	boolean existsByNameIgnoreCase(String name);

	boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

	@Query("select r from Room r where (:type is null or r.type = :type) "
			+ "and (:status is null or r.status = :status) order by r.name")
	List<Room> search(@Param("type") RoomType type, @Param("status") RoomStatus status);
}
