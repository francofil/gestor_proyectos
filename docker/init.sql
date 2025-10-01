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

-- Usuarios de ejemplo
INSERT INTO users (name, email) VALUES 
    ('Ana García', 'ana.garcia@example.com'),
    ('Carlos López', 'carlos.lopez@example.com'),
    ('María Rodríguez', 'maria.rodriguez@example.com'),
    ('Juan Pérez', 'juan.perez@example.com'),
    ('Laura Martínez', 'laura.martinez@example.com');

-- Proyectos de ejemplo
INSERT INTO projects (name, description) VALUES 
    ('Sistema de Gestión de Tareas', 'Aplicación web para gestionar tareas y proyectos de equipo'),
    ('E-commerce Platform', 'Plataforma de comercio electrónico con carrito de compras'),
    ('Blog Personal', 'Sistema de blog con gestión de contenido'),
    ('App Móvil Fitness', 'Aplicación para seguimiento de ejercicios y rutinas'),
    ('Dashboard Analytics', 'Panel de control para visualización de datos');

-- Asignación de usuarios a proyectos
INSERT INTO project_users (user_id, project_id, role) VALUES 
    (1, 1, 'admin'),        -- Ana es admin del proyecto 1
    (2, 1, 'developer'),    -- Carlos es developer del proyecto 1
    (3, 1, 'tester'),       -- María es tester del proyecto 1
    (1, 2, 'admin'),        -- Ana es admin del proyecto 2
    (4, 2, 'developer'),    -- Juan es developer del proyecto 2
    (5, 2, 'designer'),     -- Laura es designer del proyecto 2
    (2, 3, 'admin'),        -- Carlos es admin del proyecto 3
    (3, 4, 'admin'),        -- María es admin del proyecto 4
    (4, 4, 'developer'),    -- Juan es developer del proyecto 4
    (5, 5, 'admin');        -- Laura es admin del proyecto 5

-- Tareas de ejemplo
INSERT INTO tasks (title, completed, user_id, project_id) VALUES 
    -- Tareas del Proyecto 1 (Sistema de Gestión)
    ('Diseñar base de datos', TRUE, 1, 1),
    ('Crear modelos de Sequelize', TRUE, 2, 1),
    ('Implementar controladores REST', FALSE, 2, 1),
    ('Documentar API', FALSE, 2, 1),
    ('Crear interfaz de usuario', FALSE, 1, 1),
    ('Escribir tests unitarios', FALSE, 3, 1),
    ('Configurar Docker', TRUE, 1, 1),
    ('Documentar API endpoints', FALSE, 2, 1),
    
    -- Tareas del Proyecto 2 (E-commerce)
    ('Diseñar catálogo de productos', FALSE, 1, 2),
    ('Implementar carrito de compras', FALSE, 4, 2),
    ('Sistema de pagos', FALSE, 4, 2),
    ('Diseño responsive', FALSE, 5, 2),
    ('Gestión de inventario', FALSE, 1, 2),
    
    -- Tareas del Proyecto 3 (Blog)
    ('Editor de contenido', FALSE, 2, 3),
    ('Sistema de comentarios', FALSE, 2, 3),
    ('SEO optimization', FALSE, 2, 3),
    
    -- Tareas del Proyecto 4 (App Fitness)
    ('Tracking de ejercicios', FALSE, 3, 4),
    ('Calendario de rutinas', FALSE, 4, 4),
    ('Estadísticas de progreso', FALSE, 4, 4),
    ('Integración con wearables', FALSE, 3, 4),
    
    -- Tareas del Proyecto 5 (Dashboard)
    ('Gráficos interactivos', FALSE, 5, 5),
    ('Exportación de reportes', FALSE, 5, 5),
    ('Filtros avanzados', FALSE, 5, 5);
