# Resultados — Pruebas de carga OE3

Pruebas ejecutadas en entorno local el 26 de septiembre de 2026.

## Entorno

| Componente | Detalle |
|---|---|
| CPU | Intel Core i7-1355U (13th Gen), 12 hilos (`nproc`) |
| RAM | 38 GiB total (13 GiB en uso al momento de la prueba) |
| Sistema operativo | Linux 7.2.2-1-cachyos (x86_64) |
| Node.js | v26.8.1 |
| Bun | 1.3.14 |
| PostgreSQL | 16.14 (contenedor `postgres:16-alpine`, Docker Compose local) |
| Backend | NestJS 11, compilado en modo producción (`bun run build` + `node dist/src/main.js`), puerto 4000 |
| k6 | v2.3.0 |
| Cliente y servidor | La misma máquina (k6, PostgreSQL y el backend comparten CPU/red de loopback) |
| Datos | 152 activos + 14 custodios sembrados (prefijo `LT`), sobre 1 activo + 1 custodio preexistentes |

## Resultados por escenario

| Escenario | VUs (pico) | Duración | Peticiones totales | Throughput (req/s) | Latencia promedio (ms) | p95 (ms) | Máx (ms) | Tasa de error % | Errores 5xx | Checks exitosos % |
|---|---|---|---|---|---|---|---|---|---|---|
| E1 — 1 usuario | 1 | 125.1 s (2 min config.) | 85 | 0.68 | 6.52 | 10.11 | 52.14 | 0.00 | 0 | 100.00 |
| E2 — 10 concurrentes | 10 | 128.8 s (2 min config.) | 841 | 6.53 | 5.49 | 9.00 | 62.47 | 0.00 | 0 | 100.00 |
| E3 — 50 concurrentes | 50 | 157.1 s (20s rampa + 2 min pico + 10s bajada) | 4627 | 29.45 | 4.54 | 7.68 | 55.05 | 0.00 | 0 | 100.00 |
| E4 — 20 usuarios / 5 min | 20 | 309.6 s (5 min config.) | 4045 | 13.07 | 4.60 | 7.83 | 59.97 | 0.00 | 0 | 100.00 |

Todos los umbrales definidos en cada script (`http_req_failed`, `http_req_duration` p95, `checks`, y los umbrales por endpoint) **pasaron** en los cuatro escenarios — sin excepciones que "ajustar".

## Latencia p95 por endpoint — E3 (50 concurrentes)

| Endpoint | Peticiones | p95 (ms) | Error % |
|---|---|---|---|
| `GET /assets/stats` | 771 | 5.74 | 0.00 |
| `GET /assets?page=1&limit=20` | 771 | 8.08 | 0.00 |
| `GET /assets?search=LT` | 771 | 8.54 | 0.00 |
| `GET /assets/:id` | 771 | 6.66 | 0.00 |
| `GET /custodians/:id` (equipos del custodio) | 771 | 6.83 | 0.00 |
| `GET /public/assets?limit=20` | 771 | 6.20 | 0.00 |

Para referencia, el mismo desglose en los otros tres escenarios está en
`load-tests/results/e1-individual.md`, `e2-carga-ligera.md` y
`e4-sostenida.md`.

## Observaciones

- **Cero errores en los cuatro escenarios**, incluyendo E3 a 50 usuarios
  concurrentes: no se observó ningún 5xx ni ningún 429 (límite de tasa). Esto
  confirma que la estrategia de `X-Forwarded-For` distinto por VU
  (`journey.js#xffForVU`) evita que el throttler global (60 req/min por IP y
  por ruta) confunda a 50 clientes simulados con uno solo.
- **Las latencias son muy bajas y casi no escalan con la concurrencia**
  (p95 pasa de ~10 ms con 1 usuario a ~8 ms con 50 concurrentes). Esto es
  esperable en un entorno local de una sola máquina con un dataset pequeño
  (153 activos) y consultas indexadas (`@@index` en los campos usados por los
  filtros) — no debe leerse como el comportamiento esperado en producción con
  latencia de red real y mayor volumen de datos.
- **El throughput escala linealmente con las VUs** (0.68 → 6.53 → 29.45
  req/s de E1 a E3), consistente con que el cuello de botella en este
  entorno es el "think time" del script (1-2 s por paso), no la capacidad
  del backend: con 6 pasos y ~1.5 s promedio de espera entre ellos, el techo
  teórico por VU es de ~0.67 iteraciones/s de 6 peticiones ≈ 0.67 req/s por
  VU, que es casi exactamente el throughput observado (29.45/50 ≈ 0.59
  req/s por VU en E3, algo menor por el reparto de la rampa de 20s).
- **E4 (20 usuarios, 5 minutos) no mostró degradación**: la latencia y la
  tasa de error se mantuvieron estables durante toda la ventana, sin señales
  de fugas de memoria/conexiones ni acumulación de errores con el tiempo.
- **Limitación explícita de "cold start" (E2)**: no aplica en este entorno,
  porque el backend se compiló una sola vez y quedó corriendo (caliente)
  durante los cuatro escenarios, a diferencia de un despliegue
  serverless/edge que escala desde cero.
- **Hallazgo de configuración, no de rendimiento**: el `backend/.env` de
  este checkout apuntaba a una base de datos remota (`db.prisma.io`), no a
  la base local de `docker-compose.yml`. Las pruebas corrieron explícitamente
  contra la base local (variable `DATABASE_URL` inyectada por comando, sin
  modificar `backend/.env`) para cumplir la decisión de "Local PostgreSQL, no
  production traffic" del plan. Ver `load-tests/README.md`, sección
  "Prerrequisitos", para el detalle y el comando exacto.
- **Hallazgo de configuración, no de rendimiento**: el script `start:prod`
  del `package.json` del backend (`bun run dist/main`) no coincide con la
  ruta real de compilación de Nest (`dist/src/main.js`, por `sourceRoot:
  "src"` en `nest-cli.json`); se inició el compilado directamente
  (`node dist/src/main.js`) en su lugar. No se modificó el backend por
  instrucción explícita de la tarea.

## Limpieza posterior a la corrida

Tras ejecutar los cuatro escenarios se corrió `load-tests/cleanup.sql`
contra la base local y se verificaron los conteos:

| Tabla | Antes de sembrar | Después de sembrar | Después de limpiar |
|---|---|---|---|
| `Asset` | 1 | 153 | 1 |
| `Custodian` | 1 | 15 | 1 |
| `Location` | 0 | 0 | 0 |
| `User` | 1 | 1 | 1 |

La base de datos local quedó exactamente en el estado previo a la prueba.
