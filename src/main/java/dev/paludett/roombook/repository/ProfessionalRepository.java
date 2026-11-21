package dev.paludett.roombook.repository;

import dev.paludett.roombook.domain.Professional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfessionalRepository extends JpaRepository<Professional, Long> {
}
