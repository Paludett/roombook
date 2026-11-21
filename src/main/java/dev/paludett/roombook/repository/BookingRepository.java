package dev.paludett.roombook.repository;

import dev.paludett.roombook.domain.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {
}
