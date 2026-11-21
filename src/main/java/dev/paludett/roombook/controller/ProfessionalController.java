package dev.paludett.roombook.controller;

import java.net.URI;
import java.util.List;

import dev.paludett.roombook.dto.ProfessionalRequest;
import dev.paludett.roombook.dto.ProfessionalResponse;
import dev.paludett.roombook.service.ProfessionalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/professionals")
public class ProfessionalController {

	private final ProfessionalService service;

	public ProfessionalController(ProfessionalService service) {
		this.service = service;
	}

	@GetMapping
	public List<ProfessionalResponse> list(@RequestParam(required = false) String name,
			@RequestParam(required = false) String specialty) {
		return service.search(name, specialty).stream().map(ProfessionalResponse::from).toList();
	}

	@GetMapping("/{id}")
	public ProfessionalResponse get(@PathVariable Long id) {
		return ProfessionalResponse.from(service.get(id));
	}

	@PostMapping
	public ResponseEntity<ProfessionalResponse> create(@Valid @RequestBody ProfessionalRequest req) {
		ProfessionalResponse res = ProfessionalResponse.from(service.create(req));
		return ResponseEntity.created(URI.create("/professionals/" + res.id())).body(res);
	}

	@PutMapping("/{id}")
	public ProfessionalResponse update(@PathVariable Long id, @Valid @RequestBody ProfessionalRequest req) {
		return ProfessionalResponse.from(service.update(id, req));
	}
}
