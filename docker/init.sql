-- =======================
-- Tabla de usuarios
-- =======================
CREATE TABLE IF NOT EXISTS users (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =======================
-- Tabla de proyectos
-- =======================
CREATE TABLE IF NOT EXISTS projects (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =======================
-- Tabla intermedia (N:N)
-- =======================
CREATE TABLE IF NOT EXISTS project_users (
    user_id INT NOT NULL,
    project_id INT NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    PRIMARY KEY (user_id, project_id),
    CONSTRAINT fk_pu_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_pu_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- =======================
-- Tabla de tareas
-- =======================
CREATE TABLE IF NOT EXISTS tasks (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    user_id INT NOT NULL,
    project_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_task_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- =======================
-- Inserts de prueba
-- =======================
INSERT INTO users (name, email) VALUES ('prueba', 'prueba@example.com');
INSERT INTO projects (name, description) VALUES ('Gestor ADA', 'Proyecto demo para TFU');
INSERT INTO project_users (user_id, project_id, role) VALUES (1, 1, 'admin');
INSERT INTO tasks (title, completed, user_id, project_id) VALUES ('Diseñar modelo de datos', FALSE, 1, 1);
