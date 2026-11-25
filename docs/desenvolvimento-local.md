# Desenvolvimento local

Complemento do "Como rodar" do [README](../README.md).

## Banco e API (Docker Compose)

```bash
cp .env.example .env        # troque POSTGRES_PASSWORD
docker compose up -d --build
```

O `docker-compose.yml` sobe o PostgreSQL e a API com o perfil `dev`, que além das migrations carrega dados de exemplo (salas e profissionais com e-mails `@exemplo.test`, sem login).

Variáveis (no `.env`):

| Variável | Padrão | Para quê |
|---|---|---|
| `POSTGRES_PASSWORD` | sem padrão, obrigatória | senha do banco |
| `POSTGRES_DB`, `POSTGRES_USER` | `roombook` | banco e usuário |
| `DB_PORT` | `5432` | porta do banco no host (mude se estiver ocupada) |
| `SERVER_PORT` | `8080` | porta da API no host |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4200` | origem do front liberada no CORS |

Com a API no ar: `http://localhost:8080/swagger-ui/index.html` (documentação) e `http://localhost:8080/rooms`.

## Front (Angular)

```bash
cd frontend
npm install --legacy-peer-deps
npm run start:local
```

Abre em `http://localhost:4200`. O script `start:local` gera `src/environments/environment.local.ts` apontando para `http://localhost:$API_PORT` (padrão 8080).

Variáveis do front:

| Variável | Padrão | Para quê |
|---|---|---|
| `FRONT_PORT` | `4200` | porta do `ng serve` |
| `API_PORT` | `8080` | porta da API (use o mesmo valor de `SERVER_PORT`) |
| `API_URL` | `http://localhost:$API_PORT` | URL completa da API, se não for local |

Se mudar a porta do front, libere-a no CORS da API: `CORS_ALLOWED_ORIGINS=http://localhost:4223` no `.env`. Exemplo com tudo em portas alternativas:

```bash
# .env: DB_PORT=5433, SERVER_PORT=8081, CORS_ALLOWED_ORIGINS=http://localhost:4223
docker compose up -d --build
cd frontend && API_PORT=8081 FRONT_PORT=4223 npm run start:local
```

## Sem Docker para a API

Suba só o banco (`docker compose up -d db`) e rode a API na máquina:

```bash
SPRING_PROFILES_ACTIVE=dev \
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/roombook \
SPRING_DATASOURCE_USERNAME=roombook \
SPRING_DATASOURCE_PASSWORD=<a senha do .env> \
FRONT_PORT=4200 ./mvnw spring-boot:run
```

Nesse modo o CORS libera `http://localhost:$FRONT_PORT` (padrão 4200).

## Testes

Os testes `@SpringBootTest` usam o banco do `application.yaml`, que lê `POSTGRES_PASSWORD`, `DB_PORT` etc. do ambiente. O `mvnw` não lê o `.env` sozinho, então carregue-o antes:

```bash
docker compose up -d db
set -a; . ./.env; set +a; ./mvnw test   # API (os de Testcontainers também precisam de Docker)
cd frontend && npx ng test --watch=false  # front
```
