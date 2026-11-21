package dev.paludett.roombook.repository;

import java.util.List;

import dev.paludett.roombook.domain.Professional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProfessionalRepository extends JpaRepository<Professional, Long> {

	boolean existsByLicenseNumber(String licenseNumber);

	boolean existsByLicenseNumberAndIdNot(String licenseNumber, Long id);

	boolean existsByEmailIgnoreCase(String email);

	boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

	@Query("""
			select p from Professional p
			where lower(p.name) like lower(concat('%', :name, '%'))
			  and lower(p.specialty) like lower(concat('%', :specialty, '%'))
			order by p.name""")
	List<Professional> search(@Param("name") String name, @Param("specialty") String specialty);
}
