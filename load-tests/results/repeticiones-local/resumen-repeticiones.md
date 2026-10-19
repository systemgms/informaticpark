# Resumen de repeticiones

Latencia: media de la latencia promedio de cada repetición (desviación estándar muestral entre repeticiones).
Las peticiones incluyen el inicio de sesión de `setup()` (1 por repetición).

| Escenario | VUs | Iteraciones | Repeticiones | Peticiones por rep. | ¿Iguales? | Latencia media (ms) | Desv. (ms) | p95 medio (ms) | Error % | Checks % |
|---|---|---|---|---|---|---|---|---|---|---|
| e1-individual | 1 | 30 | 5 | 181 | si | 12.77 | 2.53 | 15.5 | 0 | 100 |
| e2-carga-ligera | 10 | 100 | 5 | 601 | si | 11.9 | 0.96 | 18.69 | 0 | 100 |
| e3-carga-moderada | 50 | 400 | 5 | 2401 | si | 8.64 | 0.57 | 15.18 | 0 | 100 |
| e4-sostenida | 20 | 600 | 5 | 3601 | si | 6.35 | 0.87 | 11.1 | 0 | 100 |

## Latencia promedio por repetición (ms)

- e1-individual: 9.32 / 11.26 / 15.68 / 14.44 / 13.15
- e2-carga-ligera: 12.74 / 12.46 / 11.91 / 12.11 / 10.29
- e3-carga-moderada: 9.17 / 8.62 / 8.28 / 7.9 / 9.23
- e4-sostenida: 7.3 / 7.19 / 6.17 / 5.75 / 5.33
