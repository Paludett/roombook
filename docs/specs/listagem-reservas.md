# Spec: Listagem de reservas

- **Issue:** #12
- **Status:** implementada

## Contexto
`GET /bookings` lista reservas com filtros opcionais e paginação, sem consultas extras por linha.

## Regras
- Filtros opcionais (combinam com E): `roomId`, `professionalId`, `date` (AAAA-MM-DD no fuso de `BookingProperties.zone`, compara com o início da reserva), `status` (`CONFIRMED` ou `CANCELLED`).
- Paginação Spring: `page`, `size`, `sort`. Padrão ordenado por `startTime`. Ordenação aceita só `id, startTime, endTime, status, createdAt`.
- Resposta: `Page<BookingResponse>`; `BookingResponse` ganhou `roomName` e `professionalName` (campos novos, o POST continua compatível).
- `date`, `status` ou `sort` inválidos: 400 em português (ProblemDetail).

## N+1
Medido com Hibernate Statistics (`BookingListTest.listaSemNMaisUm`: 5 reservas de 5 profissionais, sala única, contexto limpo):

| | statements |
|---|---|
| Antes (sem `@EntityGraph`) | 7 |
| Depois (`@EntityGraph(room, professional)`) | ≤ 2 (limite assertado; SELECT com JOIN + COUNT quando necessário) |

O teste falha se o N+1 voltar. Log de SQL não fica ligado no `application.yaml`.

## Critérios de aceite
- [x] Filtros por sala, profissional, data e status, com paginação
- [x] N+1 reproduzido e contagem registrada (7)
- [x] Corrigido com `@EntityGraph` e contagem registrada (≤ 2)

## Fora de escopo
- Filtro por intervalo de datas, busca textual.
