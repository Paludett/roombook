# Spec: Disponibilidade da sala

- **Issue:** #11
- **Status:** rascunho

## Contexto
A tela de agenda precisa saber, para uma sala e um dia, quais blocos de 30 minutos estão livres. `GET /rooms/{id}/availability?date=AAAA-MM-DD`.

## Regras
- Resposta lista todos os blocos de 30 min do horário de funcionamento (padrão 07:00–22:00) com um estado: `FREE` (livre), `BOOKED` (ocupado), `CLEANING` (higienização) ou `UNAVAILABLE` (indisponível por motivo que não é reserva).
- Bloco de higienização é o intervalo entre o fim da reserva e `blocked_until`.
- Reservas canceladas não ocupam blocos.
- Usa uma única consulta para as reservas do dia; nada de consulta por bloco.
- Sala em manutenção ou inativa: todos os blocos com estado `UNAVAILABLE`.
- Quando a data é hoje, blocos já passados aparecem como `UNAVAILABLE`.
- Sala inexistente: 404 (ProblemDetail). `date` ausente ou inválida: 400.

## Critérios de aceite
- [ ] Lista os blocos de 30 min do horário de funcionamento como livre, ocupado ou higienização
- [ ] Usa uma única consulta para as reservas do dia
- [ ] Sala em manutenção ou inativa retorna todos os blocos indisponíveis
- [ ] Horários já passados aparecem como indisponíveis quando a data é hoje

## Fora de escopo
- Disponibilidade de várias salas numa só chamada.
- Criação e cancelamento de reservas (ver `reserva.md` e `cancelamento.md`).
