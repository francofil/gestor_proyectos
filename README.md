# 📌 Gestor de Proyectos – Demo Arquitecturas (TFU)

## 📝 Descripción

Este proyecto es una **demo académica** para la unidad de _Soluciones Arquitectónicas_.  
Se desarrolló un **mini gestor de proyectos** siguiendo el patrón **MVC** con **Node.js, Express, TypeScript y Sequelize**, utilizando **PostgreSQL** como base de datos.

El objetivo es demostrar:

- **Contenedores (Docker Compose):** API + Base de datos aislados y portables.
- **Escalabilidad Vertical:** ampliando recursos de un mismo contenedor (CPU/RAM).
- **ACID y transacciones:** operaciones atómicas garantizadas por PostgreSQL y Sequelize.
- **CQRS (Command Query Responsibility Segregation):** separación de lecturas y escrituras usando replicación PostgreSQL Master-Replica.
- **Retry Pattern:** reintentos automáticos con backoff exponencial para manejar fallos transitorios de base de datos.
- **External Configuration Store:** configuración centralizada en archivo JSON externo con recarga en caliente.

---

## 📂 Estructura del proyecto

```
src/
 ├── commands/      # CQRS - Operaciones de ESCRITURA (usa Master DB)
 ├── queries/       # CQRS - Operaciones de LECTURA (usa Replica DB)
 ├── controllers/   # Controladores que usan Commands y Queries
 ├── models/        # Modelos Sequelize (Users, Projects, Tasks)
 ├── routes/        # Endpoints de la API
 ├── config/        # Configuración (DB con Master y Replica)
 ├── utils/         # Utilidades (Retry Pattern)
 └── app.ts         # Punto de entrada del servidor
docker/
 ├── init.sql            # Script de inicialización de la base de datos
 ├── setup-master.sh     # Configuración de replicación en Master
 └── setup-replica.sh    # Configuración de Replica como read-only
```

---

## ⚙️ Tecnologías

- **Backend:** Node.js + Express + TypeScript
- **ORM:** Sequelize
- **Base de datos:** PostgreSQL
- **Contenedores:** Docker + Docker Compose

---

## 🚀 Levantar la demo

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPO>
cd gestor_proyectos
```

### 2. Configurar variables de entorno

Copiar el archivo de ejemplo y ajustar si es necesario:

```bash
cp .env.example .env
```

📌 `.env` por defecto:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=1234
POSTGRES_DB=gestor_proyectos
DB_HOST=db
DB_PORT=5432
DB_NAME=gestor_proyectos
```

### 3. Configurar archivo de configuración externa

```bash
cp config.example.json config.json
```

Este archivo contiene toda la configuración del sistema y se puede modificar **en caliente** (sin reiniciar).

### 4. Levantar contenedores

```bash
docker-compose up --build
```

- La API quedará disponible en: [http://localhost:3000](http://localhost:3000)
- **PostgreSQL Master** (escritura): puerto `5432`
- **PostgreSQL Replica** (lectura): puerto `5433`

### 5. Datos iniciales

El contenedor de Postgres ejecuta automáticamente `docker/init.sql` en la primera ejecución:

- Crea tablas (`users`, `projects`, `tasks`, `project_users`)
- Inserta un usuario, un proyecto y una tarea de ejemplo.

---

## 📊 Endpoints principales

- `GET /users` → listar usuarios
- `POST /users` → crear usuario
- `GET /projects` → listar proyectos
- `POST /projects` → crear proyecto
- `GET /tasks` → listar tareas
- `POST /tasks` → crear tarea

---

## 🔒 ACID y transacciones

- PostgreSQL garantiza propiedades **ACID** en cada operación (`INSERT`, `UPDATE`, `DELETE`).
- Para operaciones compuestas, se implementan transacciones con Sequelize:

```ts
await sequelize.transaction(async (t) => {
  const project = await Project.create(
    { name, description },
    { transaction: t }
  );
  await Task.create(
    { title: "Primera tarea", projectId: project.id, userId },
    { transaction: t }
  );
});
```

👉 Si algo falla, se hace **rollback** y no se rompe la consistencia.

---

## 🔄 CQRS con Master-Replica

Se implementó el patrón **CQRS (Command Query Responsibility Segregation)** con **replicación streaming de PostgreSQL**:

- **Base de datos MASTER (puerto 5432):** Maneja todas las operaciones de **escritura** (Commands: INSERT, UPDATE, DELETE)
- **Base de datos REPLICA (puerto 5433):** Maneja todas las operaciones de **lectura** (Queries: SELECT) en modo **solo lectura**

### ✅ Ventajas

- **Separación de responsabilidades:** Escrituras y lecturas aisladas
- **Escalabilidad:** Múltiples replicas pueden atender lecturas sin afectar escrituras
- **Alta disponibilidad:** Si el master falla, la replica puede promovarse
- **Consistencia eventual:** Los datos se replican automáticamente del master a la replica

### 🔍 Verificar estado de replicación

```bash
docker exec gestor_db_master psql -U postgres -d gestor_proyectos -c "SELECT client_addr, state, sync_state FROM pg_stat_replication;"
```

---

## 🔄 CQRS - Master-Replica Setup

Este proyecto implementa **CQRS (Command Query Responsibility Segregation)** usando replicación de PostgreSQL:

### Arquitectura

- **Master DB (`db-master`)**: Base de datos principal para **escrituras** (Commands)
  - Puerto: `5432`
  - Configurada con `wal_level=replica` para streaming replication
- **Replica DB (`db-replica`)**: Base de datos de solo lectura para **consultas** (Queries)
  - Puerto: `5433`
  - Configurada con `default_transaction_read_only = on`
  - Sincronización automática desde el master mediante replicación física

### Configuración en el código

```typescript
// src/config/db.ts
export const sequelizeMaster = new Sequelize(...);  // Para escrituras
export const sequelizeReplica = new Sequelize(...); // Para lecturas
export const sequelize = sequelizeMaster;           // Por defecto (compatibilidad)
```

### Variables de entorno

```env
# Master DB (escritura)
DB_HOST_MASTER=db-master
DB_PORT_MASTER=5432

# Replica DB (lectura)
DB_HOST_REPLICA=db-replica
DB_PORT_REPLICA=5432
```

### Verificar que el sistema funciona correctamente

Puedes verificar que la réplica es de **solo lectura** con este comando:

```bash
# 1. Intentar escribir en la réplica (debe FALLAR)
docker exec -it gestor_db_replica psql -U postgres -d gestor_proyectos -c "CREATE TABLE test (id INT);"

# Salida esperada:
# ERROR: cannot execute CREATE TABLE in a read-only transaction
```

```bash
# 2. Verificar el estado de solo lectura
docker exec -it gestor_db_replica psql -U postgres -d gestor_proyectos -c "SHOW default_transaction_read_only;"

# Salida esperada:
# default_transaction_read_only
# -------------------------------
#  on
```

```bash
# 3. Verificar que la replicación funciona
# Escribir en el master
docker exec -it gestor_db_master psql -U postgres -d gestor_proyectos -c "SELECT COUNT(*) FROM users;"

# Leer desde la replica (debe mostrar los mismos datos)
docker exec -it gestor_db_replica psql -U postgres -d gestor_proyectos -c "SELECT COUNT(*) FROM users;"
```

### Beneficios del CQRS

- ✅ **Escalabilidad de lectura**: Las consultas se distribuyen en la réplica
- ✅ **Separación de responsabilidades**: Escrituras y lecturas en bases diferentes
- ✅ **Alta disponibilidad**: La réplica puede servir datos si el master está ocupado
- ✅ **Protección de datos**: Imposible modificar datos accidentalmente desde queries

---

## � Retry Pattern (Patrón de Reintentos)

Este proyecto implementa el **Retry Pattern** para todas las operaciones de base de datos, proporcionando **resiliencia automática** ante fallos transitorios.

### ✨ Características

- **Reintentos automáticos**: Hasta 3 reintentos por defecto
- **Backoff exponencial**: Los delays aumentan progresivamente (1s, 2s, 4s...)
- **Detección inteligente**: Solo reintenta errores transitorios (conexión, timeouts, deadlocks)
- **Logging detallado**: Registra cada intento y el resultado final

### 🎯 Errores Reintenables

- Conexión rechazada (`ECONNREFUSED`)
- Timeouts de red (`ETIMEDOUT`)
- Conexión reseteada (`ECONNRESET`)
- Deadlocks de PostgreSQL (`40P01`)
- Fallos de serialización (`40001`)

### 📖 Ejemplo de Uso

```typescript
import { retryQuery } from "../utils/retryQuery";
import { sequelizeMaster } from "../config/db";

export const createUser = async (name: string, email: string) => {
  const [result]: any = await retryQuery(
    sequelizeMaster,
    "INSERT INTO users (name, email) VALUES (:name, :email) RETURNING *",
    { replacements: { name, email } }
  );
  return result[0];
};
```

### 🔧 Configuración Personalizada

```typescript
import { retryQuery, RetryConfig } from "../utils/retryQuery";

const customConfig: RetryConfig = {
  maxRetries: 5,
  initialDelay: 2000,
  maxDelay: 30000,
  backoffMultiplier: 3,
};

await retryQuery(sequelizeMaster, "SELECT ...", {}, customConfig);
```

### 📊 Logs en Acción

```
⚠️ Intento 1/3 falló: Connection refused. Reintentando en 1000ms...
⚠️ Intento 2/3 falló: Connection timeout. Reintentando en 2000ms...
✅ Query exitosa después de 2 reintento(s)
```

### 🧪 Testing del Retry Pattern

Para probar el comportamiento del retry pattern:

```bash
# 1. Detener el contenedor de base de datos
docker-compose stop db-master

# 2. Hacer una request (verás los reintentos en los logs del servidor)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "email": "test@example.com"}'

# 3. Reiniciar la base de datos antes de que se agoten los reintentos
docker-compose start db-master
```

---

## ⚙️ External Configuration Store

Este proyecto implementa el patrón **External Configuration Store** para gestionar la configuración de forma centralizada y permitir **cambios en caliente** sin reiniciar la aplicación.

### ✨ Características

- **Configuración centralizada**: Toda la config en un archivo `config.json`
- **Recarga en caliente**: Los cambios se aplican en el siguiente request
- **Sin reinicio**: Modifica configuración mientras la app corre
- **API de gestión**: Endpoints para ver y actualizar la config

### 📁 Estructura del archivo config.json

```json
{
  "database": {
    "master": {
      "host": "db-master",
      "port": 5432,
      "database": "gestor_proyectos",
      "user": "postgres",
      "password": "1234"
    },
    "replica": {
      "host": "db-replica",
      "port": 5432,
      "database": "gestor_proyectos",
      "user": "postgres",
      "password": "1234"
    }
  },
  "server": {
    "port": 3000,
    "environment": "development"
  },
  "retry": {
    "maxRetries": 3,
    "initialDelay": 1000,
    "backoffMultiplier": 2
  },
  "features": {
    "enableLogging": true,
    "enableCache": false
  }
}
```

### 🔧 Endpoints de Configuración

```bash
# Ver configuración actual
curl http://localhost:3000/config

# Actualizar configuración (ejemplo: cambiar maxRetries)
curl -X PUT http://localhost:3000/config \
  -H "Content-Type: application/json" \
  -d '{
    "database": { ... },
    "server": { "port": 3000, "environment": "production" },
    "retry": { "maxRetries": 5, "initialDelay": 2000, "backoffMultiplier": 2 },
    "features": { "enableLogging": false, "enableCache": true }
  }'
```

### 🧪 Probar Cambios en Caliente

```bash
# 1. Hacer una petición y ver los logs
curl http://localhost:3000/users

# 2. Deshabilitar logging editando config.json
# Cambiar "enableLogging": false

# 3. Hacer otra petición - ya no verás logs
curl http://localhost:3000/users

# 4. Cambiar maxRetries a 5
# Cambiar "maxRetries": 5

# 5. Los nuevos requests usarán 5 reintentos
```

### 💡 Cómo Funciona

1. **Middleware**: Cada request ejecuta `configReloadMiddleware`
2. **Lectura**: Se lee `config.json` desde el disco
3. **Aplicación**: La nueva config se usa inmediatamente
4. **Sin caché**: No se almacena en memoria, siempre fresca

### ✅ Ventajas

- Ajustar comportamiento sin deployment
- Testing de diferentes configuraciones
- Rollback instantáneo de cambios
- Ideal para demos y desarrollo

---

## 👥 Autores

- Joaquín Ballara
- Franco Filardi
- Stefano Francolino
- Mateo Hernandez
- Mauro Machado
