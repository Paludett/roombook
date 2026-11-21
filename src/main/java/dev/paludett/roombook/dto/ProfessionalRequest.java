package dev.paludett.roombook.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProfessionalRequest(
		@NotBlank @Size(max = 150) String name,
		@NotBlank @Size(min = 3, max = 50)
		@Pattern(regexp = "^[A-Za-z0-9]+([ ./-][A-Za-z0-9]+)*$", message = "registro inválido: use letras e números separados por espaço, '.', '/' ou '-' (ex.: CRM-RS 12345)")
		String licenseNumber,
		@NotBlank @Size(max = 100) String specialty,
		@NotBlank @Size(max = 255) @Email String email) {
}
