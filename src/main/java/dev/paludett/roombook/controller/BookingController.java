package dev.paludett.roombook.controller;

import dev.paludett.roombook.dto.BookingRequest;
import dev.paludett.roombook.dto.BookingResponse;
import dev.paludett.roombook.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/bookings")
public class BookingController {

	private final BookingService service;

	public BookingController(BookingService service) {
		this.service = service;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public BookingResponse create(@Valid @RequestBody BookingRequest req) {
		return service.create(req);
	}

	@PatchMapping("/{id}/cancel")
	public BookingResponse cancel(@PathVariable Long id) {
		return service.cancel(id);
	}
}
