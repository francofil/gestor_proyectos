# 📌 Gestor de Proyectos – Demo Arquitecturas (TFU)

## 📝 Descripción
Este proyecto es una **demo académica** para la unidad de *Soluciones Arquitectónicas*.  
Se desarrolló un **mini gestor de proyectos** siguiendo el patrón **MVC** con **Node.js, Express, TypeScript y Sequelize**, utilizando **PostgreSQL** como base de datos.  

El objetivo es demostrar:  
- **Contenedores (Docker Compose):** API + Base de datos aislados y portables.  
- **Escalabilidad Vertical:** ampliando recursos de un mismo contenedor (CPU/RAM).  
- **ACID y transacciones:** operaciones atómicas garantizadas por PostgreSQL y Sequelize.  
- **CQRS (Command Query Responsibility Segregation):** separación de lecturas y escrituras usando replicación PostgreSQL Master-Replica.  

---

## 📂 Estructura del proyecto
```
src/
 ├── models/        # Modelos Sequelize (Users, Projects, Tasks)
 ├── controllers/   # Lógica de negocio
 ├── routes/        # Endpoints de la API
 ├── config/        # Configuración (DB, Sequelize)
 └── app.ts         # Punto de entrada del servidor
docker/
 └── init.sql       # Script de inicialización de la base de datos
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

### 3. Levantar contenedores
```bash
docker-compose up --build
```

- La API quedará disponible en: [http://localhost:3000](http://localhost:3000)  
- **PostgreSQL Master** (escritura): puerto `5432`  
- **PostgreSQL Replica** (lectura): puerto `5433`

### 4. Datos iniciales
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
  const project = await Project.create({ name, description }, { transaction: t });
  await Task.create({ title: "Primera tarea", projectId: project.id, userId }, { transaction: t });
});
```
👉 Si algo falla, se hace **rollback** y no se rompe la consistencia.

---

## 📈 Escalabilidad vertical
El `docker-compose.yml` define límites y reservas de recursos:  

```yaml
deploy:
  resources:
    limits:
      cpus: "2.0"
      memory: 1024M
    reservations:
      cpus: "1.0"
      memory: 512M
```

Esto permite **ampliar los recursos asignados a un único contenedor**, mostrando **escalabilidad vertical**.  

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

## 👥 Autores
- Joaquín Ballara
- Franco Filardi
- Stefano Francolino
- Mateo Hernandez
- Mauro Machado
