package dev.paludett.roombook.domain;

import dev.paludett.roombook.exception.BusinessRuleException;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "bookings")
public class Booking {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "room_id", nullable = false)
	private Room room;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "professional_id", nullable = false)
	private Professional professional;

	@Column(name = "start_time", nullable = false)
	private Instant startTime;

	@Column(name = "end_time", nullable = false)
	private Instant endTime;

	@Column(name = "blocked_until", nullable = false)
	private Instant blockedUntil;

	@Column(nullable = false)
	private String purpose;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private BookingStatus status = BookingStatus.CONFIRMED;

	@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
	private Instant updatedAt;

	public Long getId() { return id; }
	public Room getRoom() { return room; }
	public void setRoom(Room room) { this.room = room; }
	public Professional getProfessional() { return professional; }
	public void setProfessional(Professional professional) { this.professional = professional; }
	public Instant getStartTime() { return startTime; }
	public void setStartTime(Instant startTime) { this.startTime = startTime; }
	public Instant getEndTime() { return endTime; }
	public void setEndTime(Instant endTime) { this.endTime = endTime; }
	public Instant getBlockedUntil() { return blockedUntil; }
	public void setBlockedUntil(Instant blockedUntil) { this.blockedUntil = blockedUntil; }
	public String getPurpose() { return purpose; }
	public void setPurpose(String purpose) { this.purpose = purpose; }
	public BookingStatus getStatus() { return status; }

	/** Único ponto de transição CONFIRMED -> CANCELLED. */
	public void cancel(Instant now) {
		if (status != BookingStatus.CONFIRMED) {
			throw new BusinessRuleException("Só reservas confirmadas podem ser canceladas (status atual: " + status + ")");
		}
		if (!now.isBefore(startTime)) {
			throw new BusinessRuleException("Não é possível cancelar uma reserva que já foi iniciada");
		}
		status = BookingStatus.CANCELLED;
	}
	public Instant getCreatedAt() { return createdAt; }
	public Instant getUpdatedAt() { return updatedAt; }
}
