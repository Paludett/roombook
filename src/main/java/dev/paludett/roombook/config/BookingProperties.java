package dev.paludett.roombook.config;

import java.time.LocalTime;
import java.time.ZoneId;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Horário de funcionamento e fuso das reservas (roombook.booking.*). */
@ConfigurationProperties("roombook.booking")
public record BookingProperties(LocalTime opening, LocalTime closing, ZoneId zone) {

	public BookingProperties {
		if (opening == null) opening = LocalTime.of(7, 0);
		if (closing == null) closing = LocalTime.of(22, 0);
		if (zone == null) zone = ZoneId.of("America/Sao_Paulo");
	}
}
