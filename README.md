## 📂 Navegación rápida

- [🛠 Instalación](#instalacion-ancla)
- [🚀 Uso](#uso-ancla)
- [☁️ Despliegue](DEPLOYMENT.md)

## 📌 Infopark

Infopark es una aplicación web, con API REST en NestJS y panel de administración en Next.js, que permite gestionar el parque informático (inventario de bienes) de la Gobernación Provincial de Morona Santiago (GPMS).

## 🚀 Funcionalidades principales

- Registrar, buscar, editar y eliminar bienes, con su estado de condición (bueno/malo/en mantenimiento).
- Administrar los custodios responsables de cada bien.
- Administrar las ubicaciones geográficas y asociarlas a bienes y custodios.
- Traspasar bienes entre custodios y llevar el historial de movimientos.
- Consultar bienes y custodios desde páginas públicas, sin iniciar sesión.
- Administrar usuarios del sistema con roles de administrador y usuario.
- Personalizar la marca de la aplicación (nombre, colores y logo).

<a name="instalacion-ancla"></a>
## ⚙️ Instalación

### Requisitos previos

Instalar Bun, Git y Docker (para PostgreSQL local).

### Procedimiento

1. Mediante terminal, clonar el repositorio y seleccionarlo:

```shell
git clone https://github.com/systemgms/informaticpark.git
```
```shell
cd informaticpark
```

2. Levantar la base de datos PostgreSQL local:

```shell
docker compose up -d
```

3. Configurar los archivos `.env`:

Copiar `backend/.env.example` a `backend/.env` y `frontend/.env.example` a `frontend/.env`. Asegúrese de configurar las siguientes variables:

- `DATABASE_URL` (backend)
- `JWT_SECRET` (backend)
- `JWT_EXPIRES_IN` (backend)
- `NEXT_PUBLIC_BACKEND_URL` (frontend)

4. Instalar las dependencias de cada aplicación:

```shell
cd backend && bun install
```
```shell
cd ../frontend && bun install
```

5. Ejecutar la migración de la estructura de la base de datos desde `backend/`:

```shell
bun run prisma:migrate
```

Si desea crear el usuario administrador inicial, ejecutar:

```shell
bun run prisma:seed
```

<a name="uso-ancla"></a>
## ▶️ Uso

- Levantar el backend (puerto 4000, prefijo `/api`):

```shell
cd backend && bun run start:dev
```

- Levantar el frontend (puerto 3000), en otra terminal:

```shell
cd frontend && bun run dev
```

📌 Abre `http://localhost:3000` en tu navegador para usar la aplicación.

Pruebas y calidad de código:

```shell
bun run test
```
```shell
bun run lint
```

Ejecutar ambos comandos dentro de `backend/` o `frontend/`.

## 🛠 Tecnologías principales

- Bun
- TypeScript
- NestJS
- Next.js
- PostgreSQL

Paquetes utilizados:

- `"@nestjs/core": "^11.1"`
- `"@nestjs/jwt": "^11.0"`
- `"@nestjs/swagger": "^11.2"`
- `"@nestjs/throttler": "^6.5"`
- `"@prisma/client": "^7.5"`
- `"next": "^16.1"`
- `"react": "^18"`
- `"tailwindcss-animate": "^1.0"`
- `"@radix-ui/react-dialog": "^1.1"`
- `"leaflet": "^1.9"`
- `"lucide-react": "^0.435"`

## License

Este proyecto está licenciado bajo la [licencia MIT](LICENSE).
