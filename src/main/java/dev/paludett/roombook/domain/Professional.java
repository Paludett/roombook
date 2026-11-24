package dev.paludett.roombook.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "professionals")
public class Professional {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 150)
	private String name;

	@Column(name = "license_number", nullable = false, unique = true, length = 50)
	private String licenseNumber;

	@Column(nullable = false, length = 100)
	private String specialty;

	@Column(nullable = false, unique = true, length = 255)
	private String email;

	public Long getId() { return id; }
	public String getName() { return name; }
	public void setName(String name) { this.name = name; }
	public String getLicenseNumber() { return licenseNumber; }
	public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
	public String getSpecialty() { return specialty; }
	public void setSpecialty(String specialty) { this.specialty = specialty; }
	public String getEmail() { return email; }
	public void setEmail(String email) { this.email = email; }
}
