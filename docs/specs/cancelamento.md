# Spec: Cancelamento e ciclo de status da reserva

- **Issue:** #10
- **Status:** implementada

## Contexto
`PATCH /bookings/{id}/cancel` cancela uma reserva. As transições de status seguem regras fixas, concentradas num único ponto do código.

## Regras
- Só reservas `CONFIRMED` podem ser canceladas, e somente antes do início (`start_time`).
- Cancelar libera o horário e também o intervalo de higienização (a reserva deixa de contar na checagem de sobreposição).
- Qualquer transição inválida (ex.: cancelar reserva já cancelada, ou já iniciada) retorna 409 (ProblemDetail).
- Reserva inexistente: 404.
- Transições centralizadas na entidade ou num único método do service; nenhum outro código altera o status diretamente.

## Critérios de aceite
- [x] Só reservas `CONFIRMED` podem ser canceladas, e só antes do início
- [x] Cancelamento libera o horário e o intervalo de higienização
- [x] Transições inválidas retornam 409
- [x] Transições centralizadas na entidade ou num método único do service

## Fora de escopo
- Reagendamento.
- Cancelamento em lote e motivo do cancelamento.
