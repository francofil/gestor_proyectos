import express, { Application, Request, Response } from 'express';
import { sequelize } from './config/db';
import { GatekeeperMiddleware } from './middleware/gatekeeper';

// Rutas
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectsRoutes';
import taskRoutes from './routes/taskRoutes';

const app: Application = express();
const PORT = 3000;

app.use(express.json());

// 🔒 GATEKEEPER: Aplicar el patrón Gatekeeper a TODAS las rutas
app.use(GatekeeperMiddleware.validate);

// Endpoints protegidos por el Gatekeeper
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);

// Test (las ´ponemos aca para no crear otro controller)
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🚀 API funcionando con Patrón Gatekeeper',
    gatekeeper: {
      status: 'active',
      description: 'Todas las solicitudes pasan por validación del Gatekeeper',
      features: [
        'Validación de IPs',
        'Rate limiting',
        'Control de permisos por rol',
        'Sanitización de entrada',
        'Logging de auditoría'
      ]
    },
    testing: {
      instructions: 'Agrega el header "x-user-role" con valores: admin, developer, tester, designer, guest',
      example: 'curl -H "x-user-role: admin" http://localhost:3000/users'
    }
  });
});

// Endpoint para cambiar roles (para probar auth del gatekeeper)
app.post('/auth/change-role', (req: Request, res: Response) => {
  const { role } = req.body;
  const validRoles = ['admin', 'developer', 'tester', 'designer', 'guest'];
  
  if (!validRoles.includes(role)) {
    return res.status(400).json({ 
      error: 'Rol inválido',
      validRoles 
    });
  }

  res.json({ 
    message: `Para usar el rol: ${role}`,
    instructions: `Agrega el header: "x-user-role: ${role}" a tus solicitudes`,
    permissions: getPermissionsByRole(role)
  });
});

// Mostrar que permisos tiene cada rol
function getPermissionsByRole(role: string) {
  const permissions: Record<string, string[]> = {
    admin: ['Todos los permisos', 'Crear/leer/actualizar/eliminar usuarios, proyectos y tareas'],
    developer: ['Crear/leer/actualizar proyectos y tareas', 'Leer usuarios'],
    tester: ['Leer todos los recursos', 'Ver tareas de proyectos'],
    designer: ['Leer todos los recursos'],
    guest: ['Solo endpoint público (/)']
  };
  return permissions[role] || [];
}

sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexión a la BD establecida');
    app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
  })
  .catch((err: Error) => console.error('❌ Error al conectar la BD:', err));
