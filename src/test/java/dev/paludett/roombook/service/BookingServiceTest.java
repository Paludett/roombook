package dev.paludett.roombook.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.paludett.roombook.config.BookingProperties;
import dev.paludett.roombook.domain.Booking;
import dev.paludett.roombook.domain.Professional;
import dev.paludett.roombook.domain.Room;
import dev.paludett.roombook.domain.RoomStatus;
import dev.paludett.roombook.dto.BookingRequest;
import dev.paludett.roombook.exception.BusinessRuleException;
import dev.paludett.roombook.exception.InvalidRequestException;
import dev.paludett.roombook.exception.NotFoundException;
import dev.paludett.roombook.repository.BookingRepository;
import dev.paludett.roombook.repository.ProfessionalRepository;
import dev.paludett.roombook.repository.RoomRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class BookingServiceTest {

	// "agora" = 2030-01-01 10:00 -03:00
	static final Clock NOW = Clock.fixed(Instant.parse("2030-01-01T13:00:00Z"), ZoneId.of("UTC"));

	final BookingRepository bookings = mock(BookingRepository.class);
	final RoomRepository rooms = mock(RoomRepository.class);
	final ProfessionalRepository pros = mock(ProfessionalRepository.class);
	final BookingService service = new BookingService(bookings, rooms, pros,
			new BookingProperties(null, null, null), NOW);
	final Room room = new Room();

	BookingServiceTest() {
		room.setSanitizationMinutes(20);
		when(rooms.findById(1L)).thenReturn(Optional.of(room));
		when(pros.findById(1L)).thenReturn(Optional.of(new Professional()));
		when(bookings.save(any())).thenAnswer(i -> i.getArgument(0));
	}

	BookingRequest req(String startUtc, String endUtc, String purpose) {
		return new BookingRequest(1L, 1L, Instant.parse(startUtc), Instant.parse(endUtc), purpose);
	}

	static final String INICIO = "2030-01-02T14:00:00Z"; // 11:00 -03:00

	void assertInvalida(BookingRequest r, String trecho) {
		assertThatThrownBy(() -> service.create(r))
				.isInstanceOf(InvalidRequestException.class).hasMessageContaining(trecho);
	}

	@Test
	void deveCriarReservaConfirmadaComFinalidadeSemEspacosEBloqueioDeHigienizacao() {
		var r = service.create(req(INICIO, "2030-01-02T15:30:00Z", " Consulta "));
		assertThat(r.status().name()).isEqualTo("CONFIRMED");
		assertThat(r.purpose()).isEqualTo("Consulta");
		assertThat(r.blockedUntil()).isEqualTo(Instant.parse("2030-01-02T15:50:00Z"));
	}

	@Test
	void deveRecusarReservaComInicioDesalinhadoDoBloco() {
		assertInvalida(req("2030-01-02T14:10:00Z", "2030-01-02T15:30:00Z", "x"), "alinhados");
	}

	@Test
	void deveRecusarReservaComFimDesalinhadoDoBloco() {
		assertInvalida(req(INICIO, "2030-01-02T15:45:00Z", "x"), "alinhados");
	}

	@Test
	void deveRecusarReservaComFimIgualAoInicio() {
		assertInvalida(req(INICIO, INICIO, "x"), "posterior");
	}

	@Test
	void deveRecusarReservaComFimAnteriorAoInicio() {
		assertInvalida(req("2030-01-02T15:00:00Z", INICIO, "x"), "posterior");
	}

	@Test
	void deveRecusarReservaNoPassado() {
		assertInvalida(req("2029-12-31T14:00:00Z", "2029-12-31T15:00:00Z", "x"), "passado");
	}

	@Test
	void deveAceitarReservaIniciandoExatamenteAgora() {
		assertThat(service.create(req("2030-01-01T13:00:00Z", "2030-01-01T14:00:00Z", "x")).status().name())
				.isEqualTo("CONFIRMED");
	}

	@Test
	void deveRecusarReservaQueComecaAntesDaAbertura() {
		// 06:30 -03:00
		assertInvalida(req("2030-01-02T09:30:00Z", "2030-01-02T10:30:00Z", "x"), "funcionamento");
	}

	@Test
	void deveRecusarReservaQueTerminaDepoisDoFechamento() {
		// 21:00-22:30 -03:00
		assertInvalida(req("2030-01-03T00:00:00Z", "2030-01-03T01:30:00Z", "x"), "funcionamento");
	}

	@Test
	void deveRecusarReservaQueAtravessaaMeiaNoite() {
		// 23:00 de um dia a 01:00 do outro (-03:00)
		assertInvalida(req("2030-01-03T02:00:00Z", "2030-01-03T04:00:00Z", "x"), "funcionamento");
	}

	@Test
	void deveAceitarReservaTerminandoExatamenteNoFechamento() {
		// 21:00-22:00 -03:00
		service.create(req("2030-01-03T00:00:00Z", "2030-01-03T01:00:00Z", "x"));
	}

	@Test
	void deveAceitarReservaComecandoExatamenteNaAbertura() {
		// 07:00-08:00 -03:00
		service.create(req("2030-01-02T10:00:00Z", "2030-01-02T11:00:00Z", "x"));
	}

	@Test
	void deveRecusarReservaSemFinalidade() {
		assertInvalida(req(INICIO, "2030-01-02T15:00:00Z", "  "), "finalidade");
	}

	@Test
	void deveRecusarReservaDuranteHigienizacaoDeOutra() {
		// a consulta recebe fim + higienização e o repositório acusa conflito
		when(bookings.existsOverlap(any(), any(), any())).thenReturn(true);
		assertThatThrownBy(() -> service.create(req(INICIO, "2030-01-02T15:00:00Z", "x")))
				.isInstanceOf(BusinessRuleException.class).hasMessage(BookingService.OVERLAP_MESSAGE);
		verify(bookings, never()).save(any());
	}

	@Test
	void deveConsultarSobreposicaoIncluindoOsMinutosDeHigienizacaoDaSala() {
		service.create(req(INICIO, "2030-01-02T15:00:00Z", "x"));
		verify(bookings).existsOverlap(any(), eq(Instant.parse(INICIO)),
				eq(Instant.parse("2030-01-02T15:20:00Z")));
	}

	@Test
	void deveRecusarReservaEmSalaEmManutencao() {
		room.setStatus(RoomStatus.EM_MANUTENCAO);
		assertThatThrownBy(() -> service.create(req(INICIO, "2030-01-02T15:00:00Z", "x")))
				.isInstanceOf(BusinessRuleException.class).hasMessageContaining("EM_MANUTENCAO");
	}

	@Test
	void deveRecusarReservaEmSalaInativa() {
		room.setStatus(RoomStatus.INATIVA);
		assertThatThrownBy(() -> service.create(req(INICIO, "2030-01-02T15:00:00Z", "x")))
				.isInstanceOf(BusinessRuleException.class).hasMessageContaining("INATIVA");
	}

	@Test
	void deveRecusarReservaEmSalaInexistente() {
		assertThatThrownBy(() -> service.create(new BookingRequest(9L, 1L,
				Instant.parse(INICIO), Instant.parse("2030-01-02T15:00:00Z"), "x")))
				.isInstanceOf(NotFoundException.class).hasMessageContaining("Sala");
	}

	@Test
	void deveRecusarReservaDeProfissionalInexistente() {
		assertThatThrownBy(() -> service.create(new BookingRequest(1L, 9L,
				Instant.parse(INICIO), Instant.parse("2030-01-02T15:00:00Z"), "x")))
				.isInstanceOf(NotFoundException.class).hasMessageContaining("Profissional");
	}

	Booking booking(String startUtc) {
		var entity = new Booking();
		entity.setRoom(room);
		entity.setProfessional(new Professional());
		entity.setStartTime(Instant.parse(startUtc));
		return entity;
	}

	@Test
	void deveCancelarReservaConfirmadaQueAindaNaoComecou() {
		var b = booking("2030-01-02T14:00:00Z");
		when(bookings.findById(5L)).thenReturn(Optional.of(b));
		when(bookings.saveAndFlush(any())).thenAnswer(i -> i.getArgument(0));
		assertThat(service.cancel(5L).status().name()).isEqualTo("CANCELLED");
	}

	@Test
	void deveRecusarCancelamentoDeReservaJaIniciada() {
		var iniciada = booking("2030-01-01T12:00:00Z"); // início antes de "agora"
		when(bookings.findById(5L)).thenReturn(Optional.of(iniciada));
		assertThatThrownBy(() -> service.cancel(5L)).isInstanceOf(BusinessRuleException.class)
				.hasMessageContaining("iniciada");
	}

	@Test
	void deveRecusarCancelamentoDeReservaJaCancelada() {
		var b = booking("2030-01-02T14:00:00Z");
		b.cancel(NOW.instant());
		when(bookings.findById(6L)).thenReturn(Optional.of(b));
		assertThatThrownBy(() -> service.cancel(6L)).isInstanceOf(BusinessRuleException.class)
				.hasMessageContaining("confirmadas");
	}

	@Test
	void deveRecusarCancelamentoDeReservaQueComecaExatamenteAgora() {
		var b = booking("2030-01-01T13:00:00Z");
		when(bookings.findById(7L)).thenReturn(Optional.of(b));
		assertThatThrownBy(() -> service.cancel(7L)).isInstanceOf(BusinessRuleException.class);
	}

	@Test
	void deveRetornarNaoEncontradoAoCancelarReservaInexistente() {
		when(bookings.findById(99L)).thenReturn(Optional.empty());
		assertThatThrownBy(() -> service.cancel(99L)).isInstanceOf(NotFoundException.class);
	}
}
