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
-- Vista Materializada con estadísticas 
-- =======================
CREATE MATERIALIZED VIEW project_statistics AS
SELECT 
    p.id AS project_id,
    p.name AS project_name,
    p.description AS project_description,
    p.created_at AS project_created_at,
    
    -- Conteo de usuarios por proyecto
    COUNT(DISTINCT pu.user_id) AS total_users,
    
    -- Conteo de roles específicos
    COUNT(DISTINCT CASE WHEN pu.role = 'admin' THEN pu.user_id END) AS total_admins,
    COUNT(DISTINCT CASE WHEN pu.role = 'member' THEN pu.user_id END) AS total_members,
    
    -- Estadísticas de tareas
    COUNT(DISTINCT t.id) AS total_tasks,
    COUNT(DISTINCT CASE WHEN t.completed = TRUE THEN t.id END) AS completed_tasks,
    COUNT(DISTINCT CASE WHEN t.completed = FALSE THEN t.id END) AS pending_tasks,
    
    -- Porcentaje de completitud (evitando división por cero)
    CASE 
        WHEN COUNT(DISTINCT t.id) > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN t.completed = TRUE THEN t.id END)::NUMERIC / COUNT(DISTINCT t.id)::NUMERIC) * 100, 2)
        ELSE 0 
    END AS completion_percentage,
    
    -- Estadísticas por usuario asignado a tareas
    COUNT(DISTINCT t.user_id) AS users_with_tasks,
    
    -- Promedio de tareas por usuario en el proyecto
    CASE 
        WHEN COUNT(DISTINCT t.user_id) > 0
        THEN ROUND(COUNT(t.id)::NUMERIC / COUNT(DISTINCT t.user_id)::NUMERIC, 2)
        ELSE 0
    END AS avg_tasks_per_user,
    
    -- Información del usuario con más tareas
    (
        SELECT u.name 
        FROM tasks t2 
        JOIN users u ON t2.user_id = u.id 
        WHERE t2.project_id = p.id 
        GROUP BY u.id, u.name 
        ORDER BY COUNT(t2.id) DESC 
        LIMIT 1
    ) AS most_active_user,
    
    -- Cantidad de tareas del usuario más activo
    (
        SELECT COUNT(t2.id)
        FROM tasks t2 
        WHERE t2.project_id = p.id 
        GROUP BY t2.user_id 
        ORDER BY COUNT(t2.id) DESC 
        LIMIT 1
    ) AS most_active_user_tasks,
    
    -- Días desde la creación del proyecto
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p.created_at)) AS days_since_creation,
    
    -- Tarea más reciente
    (
        SELECT t3.title 
        FROM tasks t3 
        WHERE t3.project_id = p.id 
        ORDER BY t3.created_at DESC 
        LIMIT 1
    ) AS latest_task,
    
    -- Fecha de última actualización de tareas
    MAX(t.updated_at) AS last_task_update,
    
    -- Ratio de admins vs miembros
    CASE 
        WHEN COUNT(DISTINCT CASE WHEN pu.role = 'member' THEN pu.user_id END) > 0
        THEN ROUND(
            COUNT(DISTINCT CASE WHEN pu.role = 'admin' THEN pu.user_id END)::NUMERIC / 
            COUNT(DISTINCT CASE WHEN pu.role = 'member' THEN pu.user_id END)::NUMERIC, 
            2
        )
        ELSE COUNT(DISTINCT CASE WHEN pu.role = 'admin' THEN pu.user_id END)
    END AS admin_to_member_ratio,
    
    -- Concatenación de emails de todos los usuarios del proyecto
    STRING_AGG(DISTINCT u.email, ', ' ORDER BY u.email) AS user_emails,
    
    -- Lista de roles únicos en el proyecto
    STRING_AGG(DISTINCT pu.role, ', ' ORDER BY pu.role) AS available_roles

FROM projects p
LEFT JOIN project_users pu ON p.id = pu.project_id
LEFT JOIN users u ON pu.user_id = u.id
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY p.id, p.name, p.description, p.created_at;

--  índice para mejorar consultas
CREATE INDEX idx_project_statistics_project_id ON project_statistics (project_id);
CREATE INDEX idx_project_statistics_completion ON project_statistics (completion_percentage);

-- =======================
-- Inserts de prueba
-- =======================
INSERT INTO users (name, email) VALUES ('prueba', 'prueba@example.com');
INSERT INTO users (name, email) VALUES ('Juan Pérez', 'juan@example.com');
INSERT INTO users (name, email) VALUES ('María García', 'maria@example.com');

INSERT INTO projects (name, description) VALUES ('Gestor ADA', 'Proyecto demo para TFU');
INSERT INTO projects (name, description) VALUES ('Sistema de Ventas', 'ERP para ventas y facturación');

INSERT INTO project_users (user_id, project_id, role) VALUES (1, 1, 'admin');
INSERT INTO project_users (user_id, project_id, role) VALUES (2, 1, 'member');
INSERT INTO project_users (user_id, project_id, role) VALUES (3, 1, 'member');
INSERT INTO project_users (user_id, project_id, role) VALUES (1, 2, 'admin');
INSERT INTO project_users (user_id, project_id, role) VALUES (2, 2, 'admin');

INSERT INTO tasks (title, completed, user_id, project_id) VALUES ('Diseñar modelo de datos', FALSE, 1, 1);
INSERT INTO tasks (title, completed, user_id, project_id) VALUES ('Implementar API REST', FALSE, 1, 1);
INSERT INTO tasks (title, completed, user_id, project_id) VALUES ('Crear documentación', TRUE, 2, 1);
INSERT INTO tasks (title, completed, user_id, project_id) VALUES ('Testing unitario', FALSE, 2, 1);
INSERT INTO tasks (title, completed, user_id, project_id) VALUES ('Deploy en producción', FALSE, 3, 1);
INSERT INTO tasks (title, completed, user_id, project_id) VALUES ('Configurar base de datos', TRUE, 1, 2);
INSERT INTO tasks (title, completed, user_id, project_id) VALUES ('Diseñar interfaz', FALSE, 2, 2);

-- Refrescar la vista materializada con los datos insertados
REFRESH MATERIALIZED VIEW project_statistics;
