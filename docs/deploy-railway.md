# Deploy no Railway (ambiente de teste)

Três serviços no mesmo projeto: **Postgres**, **api** e **front**. A API roda com o perfil `dev`, então mantém os dados de exemplo (salas e profissionais). Nada de segredo no repositório: as credenciais vêm das variáveis do plugin Postgres.

1. **Postgres**: adicione o plugin de banco do Railway.
2. **api** (repositório, root directory `/`, usa o `Dockerfile` da raiz). Variáveis:

   | Variável | Valor |
   |---|---|
   | `SPRING_PROFILES_ACTIVE` | `dev` |
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` |
   | `SPRING_DATASOURCE_USERNAME` | `${{Postgres.PGUSER}}` |
   | `SPRING_DATASOURCE_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
   | `CORS_ALLOWED_ORIGINS` | URL pública do front (passo 4) |

   O Railway injeta `PORT` e a API o respeita (sem `PORT`, usa `SERVER_PORT`, depois `8080`). Healthcheck path: `/actuator/health`. Gere um domínio público e anote a URL.
3. **front** (root directory `frontend`, usa `frontend/Dockerfile`). Variável de build: `API_URL` = URL pública da API do passo 2. Ela entra no bundle durante o `docker build`, então mudar o valor exige novo deploy do front. Sem `API_URL` o build aponta para `http://localhost:8080`. Gere um domínio público.
4. Volte na **api** e defina `CORS_ALLOWED_ORIGINS` com a URL do front (sem barra no final); ela reinicia sozinha.

Ordem: Postgres, api, front (com a URL da api), depois o CORS da api (com a URL do front).

Teste local das imagens:

```bash
docker build --build-arg API_URL=https://api.exemplo.test -t roombook-front frontend/
docker run --rm -e PORT=8081 -p 8081:8081 roombook-front
```

Se o `docker build` do front falhar com `Inlining of fonts failed`, o build não alcançou o Google Fonts pela rede bridge do Docker (comum após reiniciar a máquina). Use a rede do host: `docker build --network=host ...`.
