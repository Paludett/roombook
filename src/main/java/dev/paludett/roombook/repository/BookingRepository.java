package dev.paludett.roombook.repository;

import dev.paludett.roombook.domain.Booking;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, Long> {

	@Query("""
			select count(b) > 0 from Booking b
			where b.room.id = :roomId and b.status = dev.paludett.roombook.domain.BookingStatus.CONFIRMED
			and b.startTime < :blockedUntil and b.blockedUntil > :start""")
	boolean existsOverlap(@Param("roomId") Long roomId, @Param("start") Instant start,
			@Param("blockedUntil") Instant blockedUntil);

	/** Reservas não canceladas da sala cujo bloqueio (reserva + higienização) toca a janela. */
	@Query("""
			select b from Booking b
			where b.room.id = :roomId and b.status <> dev.paludett.roombook.domain.BookingStatus.CANCELLED
			and b.startTime < :to and b.blockedUntil > :from""")
	java.util.List<Booking> findActiveInWindow(@Param("roomId") Long roomId, @Param("from") Instant from,
			@Param("to") Instant to);
}
