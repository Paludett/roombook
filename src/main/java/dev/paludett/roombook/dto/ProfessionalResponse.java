package dev.paludett.roombook.dto;

import dev.paludett.roombook.domain.Professional;

public record ProfessionalResponse(Long id, String name, String licenseNumber, String specialty, String email) {

	public static ProfessionalResponse from(Professional p) {
		return new ProfessionalResponse(p.getId(), p.getName(), p.getLicenseNumber(), p.getSpecialty(), p.getEmail());
	}
}
