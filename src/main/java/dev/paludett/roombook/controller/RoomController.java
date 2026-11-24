package dev.paludett.roombook.controller;

import dev.paludett.roombook.domain.RoomStatus;
import dev.paludett.roombook.domain.RoomType;
import dev.paludett.roombook.dto.RoomRequest;
import dev.paludett.roombook.dto.RoomResponse;
import dev.paludett.roombook.dto.RoomStatusRequest;
import dev.paludett.roombook.dto.AvailabilityResponse;
import dev.paludett.roombook.service.AvailabilityService;
import dev.paludett.roombook.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rooms")
public class RoomController {

	private final RoomService service;
	private final AvailabilityService availability;

	public RoomController(RoomService service, AvailabilityService availability) {
		this.service = service;
		this.availability = availability;
	}

	@GetMapping
	public List<RoomResponse> list(@RequestParam(required = false) RoomType type,
			@RequestParam(required = false) RoomStatus status) {
		return service.list(type, status);
	}

	@GetMapping("/{id}")
	public RoomResponse get(@PathVariable Long id) {
		return service.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public RoomResponse create(@Valid @RequestBody RoomRequest req) {
		return service.create(req);
	}

	@PutMapping("/{id}")
	public RoomResponse update(@PathVariable Long id, @Valid @RequestBody RoomRequest req) {
		return service.update(id, req);
	}

	@PatchMapping("/{id}/status")
	public RoomResponse changeStatus(@PathVariable Long id, @Valid @RequestBody RoomStatusRequest req) {
		return service.changeStatus(id, req.status());
	}

	@GetMapping("/{id}/availability")
	public AvailabilityResponse availability(@PathVariable Long id, @RequestParam(required = false) String date) {
		return availability.availability(id, date);
	}
}
