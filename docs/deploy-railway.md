# Deploy no Railway (ambiente de teste)

Três serviços no mesmo projeto: **Postgres**, **api** e **front**. Só o **front** tem domínio público: o nginx dele faz proxy reverso de `/api/` para a API pela rede privada, como o banco. A API roda com o perfil `dev`, então mantém os dados de exemplo (salas e profissionais). Nada de segredo no repositório: as credenciais vêm das variáveis do plugin Postgres.

Como front e API passam a ter a mesma origem (`https://<front>/api/...`), **o CORS não é necessário no Railway** e `CORS_ALLOWED_ORIGINS` não precisa ser definida.

1. **Postgres**: adicione o plugin de banco do Railway.
2. **api** (repositório, root directory `/`, usa o `Dockerfile` da raiz). **Não gere domínio público.** Variáveis:

   | Variável | Valor |
   |---|---|
   | `SPRING_PROFILES_ACTIVE` | `dev` |
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` |
   | `SPRING_DATASOURCE_USERNAME` | `${{Postgres.PGUSER}}` |
   | `SPRING_DATASOURCE_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
   | `PORT` | `8080` (fixa a porta para o front apontar; sem `PORT` a API usa `SERVER_PORT`, depois `8080`) |

   Healthcheck path: `/actuator/health` (o healthcheck do Railway fala direto com a API; o proxy bloqueia `/api/actuator`).
3. **front** (root directory `frontend`, usa `frontend/Dockerfile`). O bundle já chama `/api` (padrão de `API_URL` na imagem), então não há variável de build. Variável de runtime:

   | Variável | Valor |
   |---|---|
   | `API_UPSTREAM` | `http://${{api.RAILWAY_PRIVATE_DOMAIN}}:8080` |

   A referência acompanha o serviço `api` sozinha (renomear o serviço exige ajustar o nome). Mudar `API_UPSTREAM` não exige rebuild, só reinício. Gere o domínio público do front.
4. Com o domínio do front gerado, troque no `README.md` o comentário `<!-- Demo: ... -->` (logo abaixo da frase inicial) por links reais: `Demo: https://<dominio-do-front> · API (Swagger): https://<dominio-do-front>/api/swagger-ui/index.html`.

Ordem: Postgres, api, front. O nginx resolve o DNS da API em runtime (`resolver` + variável no `proxy_pass`), então o front sobe mesmo se a API ainda não existir (responde 502 em `/api/` até ela subir).

O proxy libera o Swagger (`/api/swagger-ui/index.html`, "Try it out" incluso, com `server.forward-headers-strategy: framework` na API para as URLs saírem com o domínio do front e o prefixo `/api`) e responde 404 para `/api/actuator`.

## Rede privada: IPv6 e DNS

Segundo a documentação do Railway ([how it works](https://docs.railway.com/networking/private-networking/how-it-works), conferida em 25/11/2026):

- Ambientes criados depois de 16/10/2025: o nome `*.railway.internal` resolve para IPv4 e IPv6. Nada a configurar.
- Ambientes antigos (legacy): o nome resolve **só para IPv6**. O nginx resolve AAAA por padrão, então o front funciona, mas a API precisa escutar em IPv6: defina `SERVER_ADDRESS=::` na api (o Spring lê a variável; em Linux `::` atende IPv4 também). Não defina isso localmente em Docker sem IPv6.
- Use `http://` (o tráfego já é criptografado pela rede privada) e a porta em que a API escuta. A rede privada só existe em runtime, não no build.
- O resolver DNS do nginx vem do `/etc/resolv.conf` do container (`NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1` na imagem). A documentação do Railway não cita IP de resolver nem configuração de nginx/Java; o comportamento acima foi validado em rede docker, não no Railway.

Teste local das imagens:

```bash
docker build -t roombook-api .
docker build -t roombook-front frontend/
docker network create rb
docker run -d --name db --network rb -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=roombook -e POSTGRES_USER=roombook postgres:16
docker run -d --name api --network rb -e SPRING_PROFILES_ACTIVE=dev \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/roombook \
  -e SPRING_DATASOURCE_USERNAME=roombook -e SPRING_DATASOURCE_PASSWORD=dev roombook-api   # sem -p
docker run --rm --network rb -p 8081:8080 roombook-front   # API_UPSTREAM padrão: http://api:8080
curl -s localhost:8081/api/rooms
```

Se o `docker build` do front falhar com `Inlining of fonts failed`, o build não alcançou o Google Fonts pela rede bridge do Docker (comum após reiniciar a máquina). Use a rede do host: `docker build --network=host ...`.
