# Spec: Criação de reserva com validação de horário

- **Issue:** #8
- **Status:** rascunho

## Contexto
Profissionais reservam salas por período. `POST /bookings` cria uma reserva já confirmada, validando horário, estado da sala e dados obrigatórios.

## Regras
- Início e fim alinhados a blocos de 30 minutos; duração é múltiplo de 30 min.
- A reserva deve caber no horário de funcionamento (padrão 07:00–22:00, configurável por propriedade).
- Não é permitido reservar no passado.
- Sala em manutenção ou inativa não aceita reservas.
- Finalidade (`purpose`) é obrigatória e não pode ser vazia.
- `blocked_until` é calculado no servidor: `fim + minutos de higienização da sala`. O cliente nunca envia esse campo.
- Reserva criada com status `CONFIRMED`.
- Violação de regra retorna erro no formato ProblemDetail (400 para entrada inválida, 409 para conflito de estado/horário).

## Critérios de aceite
- [ ] Duração em blocos de 30 minutos
- [ ] Dentro do horário de funcionamento (07:00–22:00, configurável)
- [ ] Não permite reservar no passado nem sala em manutenção ou inativa
- [ ] Finalidade obrigatória
- [ ] `blocked_until` calculado no servidor: fim + minutos de higienização da sala

## Fora de escopo
- Sobreposição entre reservas (ver `sobreposicao-higienizacao.md`, #9).
- Cancelamento (ver `cancelamento.md`, #10).
- Autenticação e dono da reserva.
