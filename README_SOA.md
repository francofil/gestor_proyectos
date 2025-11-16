# Gestor de Proyectos - Arquitectura SOA

API REST para gestión de proyectos con arquitectura orientada a servicios.

## Servicios

- **Orchestrator** (`:3000`) - Punto de entrada, coordina todo
- **Auth** (`:3001`) - Login y registro
- **User** (`:3002`) - CRUD usuarios
- **Project** (`:3003`) - CRUD proyectos
- **Task** (`:3004`) - CRUD tareas
- **PostgreSQL** (`:5432`) - Base de datos

## Estructura
```
gestor_proyectos/
├── orchestrator/
├── services/
│   ├── auth/
│   ├── user/
│   ├── project/
│   └── task/
├── docker-compose.yml
└── docker/init.sql
```

## Setup
```bash
# Crear .env en la raíz
POSTGRES_USER=usuario
POSTGRES_PASSWORD=password
POSTGRES_DB=gestor_proyectos
JWT_SECRET=tu_secret_key

# Levantar todo
docker-compose up --build

# Ver logs
docker-compose logs -f orchestrator
```

## API

Base: `http://localhost:3000/api`

**Auth** (sin token)
- `POST /auth/register` - Crear cuenta
- `POST /auth/login` - Devuelve JWT
- `POST /auth/logout` - Invalida token

**Users** (requiere token)
- `GET /users` - Listar
- `GET /users/:id` - Ver uno

**Projects**
- `GET /projects` - Listar
- `GET /projects/:id` - Ver uno
- `POST /projects` - Crear
- `PUT /projects/:id` - Editar
- `DELETE /projects/:id` - Borrar

**Asignaciones**
- `POST /projects/:projectId/assign/:userId` - Asignar usuario
- `DELETE /projects/:projectId/assign/:userId` - Remover
- `GET /projects/:projectId/users` - Ver equipo
- `GET /users/:userId/projects` - Proyectos del usuario

**Tasks**
- `GET /tasks` - Listar
- `GET /tasks/:id` - Ver una
- `POST /tasks` - Crear
- `PUT /tasks/:id` - Editar
- `DELETE /tasks/:id` - Borrar

## Workflows especiales

**Crear proyecto completo**
`POST /projects/complete`
```json
{
  "project": { "name": "...", "description": "..." },
  "team": [
    { "userId": 1, "role": "admin" },
    { "userId": 2, "role": "member" }
  ],
  "initialTasks": [
    { "title": "...", "userId": 1 }
  ]
}
```
Crea proyecto, asigna equipo y tareas de una sola vez.

**Vista completa**
`GET /projects/:id/overview`

Devuelve proyecto con equipo, tareas y estadísticas.

## Autenticación

- Tokens JWT válidos 24hs
- Header: `Authorization: Bearer <token>`
- Al logout el token se invalida en blacklist
- Contraseñas hasheadas con bcrypt