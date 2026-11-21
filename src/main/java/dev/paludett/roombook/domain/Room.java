package dev.paludett.roombook.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "rooms")
public class Room {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 100)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 50)
	private RoomType type;

	@Column(name = "floor_wing", nullable = false, length = 100)
	private String floorWing;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private RoomStatus status = RoomStatus.ATIVA;

	@Column(name = "sanitization_minutes", nullable = false)
	private int sanitizationMinutes;

	public Long getId() { return id; }
	public String getName() { return name; }
	public void setName(String name) { this.name = name; }
	public RoomType getType() { return type; }
	public void setType(RoomType type) { this.type = type; }
	public String getFloorWing() { return floorWing; }
	public void setFloorWing(String floorWing) { this.floorWing = floorWing; }
	public RoomStatus getStatus() { return status; }
	public void setStatus(RoomStatus status) { this.status = status; }
	public int getSanitizationMinutes() { return sanitizationMinutes; }
	public void setSanitizationMinutes(int m) { this.sanitizationMinutes = m; }
}
