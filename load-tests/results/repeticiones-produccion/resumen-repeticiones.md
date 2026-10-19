# Resumen de repeticiones

Latencia: media de la latencia promedio de cada repetición (desviación estándar muestral entre repeticiones).
Las peticiones incluyen el inicio de sesión de `setup()` (1 por repetición).

| Escenario | VUs | Iteraciones | Repeticiones | Peticiones por rep. | ¿Iguales? | Latencia media (ms) | Desv. (ms) | p95 medio (ms) | Error % | Checks % |
|---|---|---|---|---|---|---|---|---|---|---|
| e1-individual | 1 | 30 | 5 | 181 | si | 285.37 | 5.12 | 454.21 | 0 | 100 |
| e2-carga-ligera | 10 | 100 | 5 | 601 | si | 297.03 | 71.02 | 508.89 | 2.96 | 97.04 |

## Latencia promedio por repetición (ms)

- e1-individual: 281.08 / 283.46 / 283.34 / 294.22 / 284.76
- e2-carga-ligera: 320.13 / 249.48 / 255.54 / 247.87 / 412.12
