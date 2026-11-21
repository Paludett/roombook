package dev.paludett.roombook.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import dev.paludett.roombook.domain.RoomStatus;
import dev.paludett.roombook.domain.RoomType;
import dev.paludett.roombook.dto.RoomRequest;
import dev.paludett.roombook.exception.BusinessRuleException;
import dev.paludett.roombook.exception.NotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class RoomServiceTest {

	@Autowired RoomService service;

	@Test
	void defaultsSanitizationByTypeAndAllowsOverride() {
		assertThat(service.create(new RoomRequest("P1", RoomType.SALA_PROCEDIMENTO, "2A", null))
				.sanitizationMinutes()).isEqualTo(15);
		assertThat(service.create(new RoomRequest("C1", RoomType.CONSULTORIO, "2A", null))
				.sanitizationMinutes()).isEqualTo(20);
		assertThat(service.create(new RoomRequest("E1", RoomType.SALA_EXAME, "2A", null))
				.sanitizationMinutes()).isEqualTo(10);
		assertThat(service.create(new RoomRequest("R1", RoomType.SALA_REUNIAO, "2A", null))
				.sanitizationMinutes()).isZero();
		assertThat(service.create(new RoomRequest("R2", RoomType.SALA_REUNIAO, "2A", 5))
				.sanitizationMinutes()).isEqualTo(5);
	}

	@Test
	void duplicateNameConflictsOnCreateAndUpdate() {
		service.create(new RoomRequest("Sala X", RoomType.CONSULTORIO, "1A", null));
		var other = service.create(new RoomRequest("Sala Y", RoomType.CONSULTORIO, "1A", null));
		assertThatThrownBy(() -> service.create(new RoomRequest("sala x", RoomType.CONSULTORIO, "1A", null)))
				.isInstanceOf(BusinessRuleException.class);
		assertThatThrownBy(() -> service.update(other.id(), new RoomRequest("SALA X", RoomType.CONSULTORIO, "1A", null)))
				.isInstanceOf(BusinessRuleException.class);
	}

	@Test
	void filtersAndStatusChange() {
		var a = service.create(new RoomRequest("F1", RoomType.SALA_EXAME, "3B", null));
		service.create(new RoomRequest("F2", RoomType.CONSULTORIO, "3B", null));
		service.changeStatus(a.id(), RoomStatus.EM_MANUTENCAO);
		assertThat(service.list(RoomType.SALA_EXAME, RoomStatus.EM_MANUTENCAO)).extracting("id").containsExactly(a.id());
		assertThat(service.list(RoomType.CONSULTORIO, RoomStatus.EM_MANUTENCAO)).isEmpty();
	}

	@Test
	void missingRoomIsNotFound() {
		assertThatThrownBy(() -> service.get(-1L)).isInstanceOf(NotFoundException.class);
	}
}
