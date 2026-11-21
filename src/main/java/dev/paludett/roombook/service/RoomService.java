package dev.paludett.roombook.service;

import dev.paludett.roombook.domain.Room;
import dev.paludett.roombook.domain.RoomStatus;
import dev.paludett.roombook.domain.RoomType;
import dev.paludett.roombook.dto.RoomRequest;
import dev.paludett.roombook.dto.RoomResponse;
import dev.paludett.roombook.exception.BusinessRuleException;
import dev.paludett.roombook.exception.NotFoundException;
import dev.paludett.roombook.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RoomService {

	private final RoomRepository repository;

	public RoomService(RoomRepository repository) {
		this.repository = repository;
	}

	/** Minutos de higienização padrão por tipo de sala. */
	public static int defaultSanitizationMinutes(RoomType type) {
		return switch (type) {
			case SALA_PROCEDIMENTO -> 15;
			case CONSULTORIO -> 20;
			case SALA_EXAME -> 10;
			case SALA_REUNIAO -> 0;
		};
	}

	@Transactional(readOnly = true)
	public List<RoomResponse> list(RoomType type, RoomStatus status) {
		return repository.search(type, status).stream().map(RoomResponse::from).toList();
	}

	@Transactional(readOnly = true)
	public RoomResponse get(Long id) {
		return RoomResponse.from(find(id));
	}

	public RoomResponse create(RoomRequest req) {
		if (repository.existsByNameIgnoreCase(req.name().trim())) {
			throw new BusinessRuleException("Já existe uma sala com o nome '" + req.name().trim() + "'");
		}
		Room room = new Room();
		apply(room, req);
		return RoomResponse.from(repository.save(room));
	}

	public RoomResponse update(Long id, RoomRequest req) {
		Room room = find(id);
		if (repository.existsByNameIgnoreCaseAndIdNot(req.name().trim(), id)) {
			throw new BusinessRuleException("Já existe uma sala com o nome '" + req.name().trim() + "'");
		}
		apply(room, req);
		return RoomResponse.from(room);
	}

	public RoomResponse changeStatus(Long id, RoomStatus status) {
		Room room = find(id);
		room.setStatus(status);
		return RoomResponse.from(room);
	}

	private Room find(Long id) {
		return repository.findById(id).orElseThrow(() -> new NotFoundException("Sala não encontrada: " + id));
	}

	private void apply(Room room, RoomRequest req) {
		room.setName(req.name().trim());
		room.setType(req.type());
		room.setFloorWing(req.floorWing().trim());
		room.setSanitizationMinutes(req.sanitizationMinutes() != null ? req.sanitizationMinutes()
				: defaultSanitizationMinutes(req.type()));
	}
}
