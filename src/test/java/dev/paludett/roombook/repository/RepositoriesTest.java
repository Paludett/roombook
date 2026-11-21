package dev.paludett.roombook.repository;

import static org.assertj.core.api.Assertions.assertThat;

import dev.paludett.roombook.domain.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class RepositoriesTest {

	@Autowired RoomRepository rooms;
	@Autowired ProfessionalRepository professionals;
	@Autowired BookingRepository bookings;

	@Test
	void persistsBookingWithRelations() {
		Room r = new Room();
		r.setName("Sala 1");
		r.setType(RoomType.CONSULTORIO);
		r.setFloorWing("2A");
		r = rooms.saveAndFlush(r);

		Professional p = new Professional();
		p.setName("Dra. Ana");
		p.setLicenseNumber("CRM-1");
		p.setSpecialty("Clínica");
		p.setEmail("ana@x.com");
		p = professionals.saveAndFlush(p);

		Instant s = Instant.now().truncatedTo(ChronoUnit.SECONDS);
		Booking b = new Booking();
		b.setRoom(r);
		b.setProfessional(p);
		b.setStartTime(s);
		b.setEndTime(s.plusSeconds(3600));
		b.setBlockedUntil(s.plusSeconds(4200));
		b.setPurpose("Consulta");
		b = bookings.saveAndFlush(b);

		assertThat(bookings.findById(b.getId())).get()
				.satisfies(x -> assertThat(x.getStatus()).isEqualTo(BookingStatus.CONFIRMED));
		assertThat(rooms.findById(r.getId()).get().getStatus()).isEqualTo(RoomStatus.ATIVA);
	}
}
