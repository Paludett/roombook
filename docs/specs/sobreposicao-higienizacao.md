# Spec: Sobreposição de reservas com higienização

- **Issue:** #9
- **Status:** rascunho

## Contexto
Uma sala nunca pode ter duas reservas ativas no mesmo horário. Depois de cada reserva há um intervalo de higienização, que também bloqueia a sala.

## Regras
- Uma reserva ocupa o intervalo `[start_time, blocked_until)`, onde `blocked_until = fim + higienização`.
- Duas reservas ativas da mesma sala conflitam quando `start_time < :novoBlockedUntil AND blocked_until > :novoInicio`.
- Reservas canceladas são ignoradas na checagem.
- Checagem em duas camadas: no service (resposta rápida e mensagem clara) e no banco (garantia contra corrida entre requisições concorrentes).
- No banco: extensão `btree_gist` e exclusion constraint sobre `room_id WITH =` e `tstzrange(start_time, blocked_until) WITH &&`, apenas para status ativos.
- `blocked_until` é coluna persistida: `timestamptz + interval` não é immutable e não pode ser usado direto na constraint.
- Violação da constraint é convertida em 409 com mensagem clara (ProblemDetail).
- Migration versionada por timestamp.

## Critérios de aceite
- [ ] Checagem no service com query `start_time < :novoBlockedUntil AND blocked_until > :novoInicio`, ignorando canceladas
- [ ] Reforço no banco: migration com `btree_gist` e exclusion constraint sobre `tstzrange(start_time, blocked_until)` para status ativos
- [ ] `blocked_until` é coluna persistida porque `timestamptz + interval` não é immutable e não pode ser usado direto na constraint
- [ ] Violação da constraint convertida em 409 com mensagem clara

## Fora de escopo
- Validação de horário e dados da reserva (ver `reserva.md`, #8).
- Teste de integração com Testcontainers (#14).
