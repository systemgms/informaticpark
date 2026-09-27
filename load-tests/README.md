# Pruebas de carga (OE3)

Este directorio contiene las pruebas de rendimiento del objetivo específico
OE3 de la tesis ("pruebas funcionales y de rendimiento", `juank2820mm1.docx`
§1.4.2), para los escenarios de la Tabla 3.14.1 (§3.14):

| ID | Carga | Métricas |
|---|---|---|
| E1 | 1 usuario | tiempo de respuesta, tasa de éxito |
| E2 | 10 concurrentes | latencia p95 (el "cold start" no aplica en local; ver más abajo) |
| E3 | 50 concurrentes | throughput, errores 5xx |
| E4 | 20 usuarios durante 5 minutos | disponibilidad |

Herramienta: [k6](https://k6.io/) (`k6 v2.3.0`).

## Prerrequisitos

1. **PostgreSQL local** corriendo (este proyecto trae `docker-compose.yml` en
   la raíz: `docker compose up -d db`). Verificar con:
   ```bash
   docker ps --filter name=informaticpark-db
   ```
2. La base de datos debe tener aplicadas todas las migraciones del backend:
   ```bash
   cd backend
   DATABASE_URL="postgresql://informaticpark:informaticpark_dev@localhost:5432/informaticpark" \
     bunx prisma migrate deploy
   ```
   > **Importante — verificar antes de correr nada:** el `backend/.env` de
   > este checkout tenía, al momento de escribir esto, `DATABASE_URL`
   > apuntando a una base **remota** (`db.prisma.io`), no a la base local de
   > `docker-compose.yml`. Las pruebas de carga corren exclusivamente contra
   > la base **local** (Decisión del plan: "Local PostgreSQL. No production
   > traffic."). Este README y `T2` usan la URL local explícita en cada
   > comando (por variable de entorno), sin modificar `backend/.env`, para no
   > alterar la configuración de otro flujo de trabajo. Antes de ejecutar
   > nada, confirma con `echo $DATABASE_URL` (o revisando `backend/.env`) que
   > no vas a apuntar accidentalmente a una base remota.
3. Backend compilado en modo producción (no `start:dev`):
   ```bash
   cd backend
   bun run build
   DATABASE_URL="postgresql://informaticpark:informaticpark_dev@localhost:5432/informaticpark" \
     bun run start:prod &
   # Esperar a que responda:
   curl -sf http://localhost:4000/api/health
   ```
4. k6 instalado (`k6 version`; en este equipo vía `mise`, ya en el `PATH`).

## Seed y limpieza

`seed.sql` inserta 14 custodios y 152 activos, todos con prefijo `LT`
(identificador/código), replicando las cifras de la tesis (152 equipos, 14
tenencias). Es idempotente (usa `ON CONFLICT DO NOTHING`).

```bash
cd load-tests
psql "postgresql://informaticpark:informaticpark_dev@localhost:5432/informaticpark" -f seed.sql
```

Esto también genera `load-tests/seed-data.json` (ids de los activos/custodios
sembrados), que `journey.js` usa para elegir un id aleatorio en cada
iteración (`GET /assets/:id`, `GET /custodians/:id`). Ese archivo no se
versiona (ver `.gitignore`): es un artefacto de la corrida local.

Limpieza (elimina exactamente las filas `LT %` y nada más):

```bash
psql "postgresql://informaticpark:informaticpark_dev@localhost:5432/informaticpark" -f load-tests/cleanup.sql
```

Verificar que la base vuelve al estado previo (1 activo, 1 custodio, 0
ubicaciones, 1 usuario):

```bash
psql "postgresql://informaticpark:informaticpark_dev@localhost:5432/informaticpark" \
  -c 'select count(*) from "Asset";' \
  -c 'select count(*) from "Custodian";' \
  -c 'select count(*) from "Location";' \
  -c 'select count(*) from "User";'
```

## Ejecutar los escenarios

Siempre desde `load-tests/` (los scripts escriben en `./results/`), en orden
y **de forma secuencial, nunca en paralelo** (comparten la misma base de
datos y el mismo proceso de backend; correrlos a la vez invalidaría las
mediciones de cada uno):

```bash
cd load-tests
k6 run e1-individual.js   # ~2 min
k6 run e2-carga-ligera.js # ~2 min
k6 run e3-carga-moderada.js # ~2.5 min (20s rampa + 2min pico + 10s bajada)
k6 run e4-sostenida.js    # 5 min
```

Cada script genera `results/<escenario>.json` (resumen crudo de k6,
ignorado por git) y `results/<escenario>.md` (tabla compacta, versionada,
lista para pegar en el capítulo IV).

Para apuntar a otra URL/credenciales:

```bash
k6 run -e BASE_URL=http://localhost:4000/api -e ADMIN_EMAIL=... -e ADMIN_PASSWORD=... e1-individual.js
```

## El "recorrido" (journey) de cada iteración

Cada iteración de VU simula un admin autenticado navegando el dashboard
(`odd/tasks/load-tests.md`, sección "Workload mix"):

1. `GET /assets/stats` (tarjetas del dashboard)
2. `GET /assets?page=1&limit=20` (lista paginada)
3. `GET /assets?search=LT` (búsqueda)
4. `GET /assets/:id` (detalle de un activo sembrado, id aleatorio)
5. `GET /custodians/:id` (equipos de un custodio -- ver nota abajo)
6. `GET /public/assets?limit=20` (catálogo público, sin autenticación)

Con 1-2s de "think time" entre pasos, para no disparar peticiones espalda
con espalda como lo haría un bot en vez de una persona.

**Nota sobre "el custodio y sus activos":** `CustodiansController` no tiene
una ruta `/custodians/:id/assets` separada. `CustodiansService#findOne`
incluye `assets: true` en `GET /custodians/:id`
(`backend/src/custodians/custodians.service.ts`), y la página del frontend
`/admin/custodians/[id]/assets` simplemente lee `custodian.assets` de esa
misma respuesta (`frontend/src/app/admin/custodians/[id]/assets/page.tsx`).
Por eso el journey usa `GET /custodians/:id`, que es la ruta real.

**Login excluido del mix de carga:** el login se hace una sola vez por
corrida, en `setup()`, y el token resultante se reutiliza en todos los VUs.
Esto es intencional, no una simplificación de conveniencia:
`POST /auth/login` tiene su propio límite estricto
(`@Throttle({ default: { limit: 5, ttl: 60000 } })`, 5/min por IP de
cliente) -- meterlo en cada iteración, desde muchos VUs, produciría 429 casi
de inmediato y esos 429 serían ruido del limitador de login, no una señal
sobre los endpoints que realmente queremos medir. Es además más realista:
un admin inicia sesión una vez y trabaja, no re-inicia sesión en cada clic.

## Throttling: por qué cada VU manda su propio `X-Forwarded-For`

El backend registra un throttler global (`backend/src/app.module.ts`,
`ThrottlerModule.forRoot`, bucket `'default'`: 60 peticiones/min) y
`trust proxy = 1` (`backend/src/config/trust-proxy.config.ts`), para que
Express derive `req.ip` del `X-Forwarded-For` del cliente en vez de siempre
ver la IP del proxy.

Una precisión importante frente al plan original: la clave de ese contador
en `@nestjs/throttler` no es solo la IP -- es
`sha256(Controlador-Handler-nombreDelThrottler-IP)`
(`node_modules/@nestjs/throttler/dist/throttler.guard.js`, método
`generateKey`). Es decir, el límite de 60/min es **por IP Y por ruta**, no
un contador global compartido entre todos los endpoints. Esto no cambia la
estrategia (cada VU sigue necesitando su propia IP simulada), pero sí el
motivo: sin `X-Forwarded-For` distinto por VU, **cada ruta individual**
(p. ej. `GET /assets/stats`) vería 50 peticiones/min desde una sola IP en
E3, superando el límite ampliamente aunque el total de tráfico esté repartido
entre seis rutas distintas.

`journey.js#xffForVU(vu)` genera `10.0.<subred>.<host>` distinto por VU
(estable durante toda la corrida de ese VU), simulando usuarios reales
detrás de la red institucional. El límite del throttler **no se
deshabilita** en ningún momento.

## Limitaciones locales

- **Sin "cold start" real**: el backend arranca una sola vez (T2) y queda
  caliente durante los cuatro escenarios; E2 no mide un arranque desde cero
  como lo haría una función serverless/edge. Se documenta explícitamente en
  vez de simularlo.
- **Una sola máquina como cliente y servidor**: k6, PostgreSQL y el backend
  compiten por el mismo CPU/red de loopback. La latencia y el throughput
  medidos son optimistas frente a un despliegue con cliente y servidor
  separados por una red real.
- **Aproximación del throttling**: los `X-Forwarded-For` sintéticos modelan
  IPs de clientes distintos, pero siguen siendo un solo proceso k6 en una
  sola máquina abriendo todas las conexiones.
