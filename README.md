# 📌 Gestor de Proyectos – Demo Arquitecturas (TFU)

## 📝 Descripción
Este proyecto es una **demo académica** para la unidad de *Soluciones Arquitectónicas*.  
Se desarrolló un **mini gestor de proyectos** siguiendo el patrón **MVC** con **Node.js, Express, TypeScript y Sequelize**, utilizando **PostgreSQL** como base de datos.  

El objetivo es demostrar:  
- **Contenedores (Docker Compose):** API + Base de datos aislados y portables.  
- **Escalabilidad Vertical:** ampliando recursos de un mismo contenedor (CPU/RAM).  
- **ACID y transacciones:** operaciones atómicas garantizadas por PostgreSQL y Sequelize.  

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
- PostgreSQL corre en el puerto `5432`.

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

## 👥 Autores
- Joaquín Ballara
- Franco Filardi
- Stefano Francolino
- Mateo Hernandez
- Mauro Machado
