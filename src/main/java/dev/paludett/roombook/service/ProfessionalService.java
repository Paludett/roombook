package dev.paludett.roombook.service;

import java.util.List;

import dev.paludett.roombook.domain.Professional;
import dev.paludett.roombook.dto.ProfessionalRequest;
import dev.paludett.roombook.exception.BusinessRuleException;
import dev.paludett.roombook.exception.NotFoundException;
import dev.paludett.roombook.repository.ProfessionalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfessionalService {

	private final ProfessionalRepository repository;

	public ProfessionalService(ProfessionalRepository repository) {
		this.repository = repository;
	}

	@Transactional(readOnly = true)
	public List<Professional> search(String name, String specialty) {
		return repository.search(name == null ? "" : name.trim(), specialty == null ? "" : specialty.trim());
	}

	@Transactional(readOnly = true)
	public Professional get(Long id) {
		return repository.findById(id)
				.orElseThrow(() -> new NotFoundException("Profissional " + id + " não encontrado"));
	}

	@Transactional
	public Professional create(ProfessionalRequest req) {
		if (repository.existsByLicenseNumber(req.licenseNumber())) {
			throw new BusinessRuleException("Registro profissional já cadastrado");
		}
		if (repository.existsByEmailIgnoreCase(req.email())) {
			throw new BusinessRuleException("E-mail já cadastrado");
		}
		return repository.save(apply(new Professional(), req));
	}

	@Transactional
	public Professional update(Long id, ProfessionalRequest req) {
		Professional p = get(id);
		if (repository.existsByLicenseNumberAndIdNot(req.licenseNumber(), id)) {
			throw new BusinessRuleException("Registro profissional já cadastrado");
		}
		if (repository.existsByEmailIgnoreCaseAndIdNot(req.email(), id)) {
			throw new BusinessRuleException("E-mail já cadastrado");
		}
		return repository.save(apply(p, req));
	}

	private static Professional apply(Professional p, ProfessionalRequest req) {
		p.setName(req.name().trim());
		p.setLicenseNumber(req.licenseNumber());
		p.setSpecialty(req.specialty().trim());
		p.setEmail(req.email());
		return p;
	}
}
