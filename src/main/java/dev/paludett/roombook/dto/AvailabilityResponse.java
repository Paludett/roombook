package dev.paludett.roombook.dto;

import java.time.LocalDate;
import java.util.List;

public record AvailabilityResponse(Long roomId, LocalDate date, List<AvailabilityBlock> blocks) {
}
