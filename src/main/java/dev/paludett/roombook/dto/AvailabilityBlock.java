package dev.paludett.roombook.dto;

import java.time.Instant;

/** Bloco de 30 min da agenda de uma sala. {@code start}/{@code end} em UTC. */
public record AvailabilityBlock(Instant start, Instant end, State state) {

	public enum State { FREE, BOOKED, CLEANING, UNAVAILABLE }
}
