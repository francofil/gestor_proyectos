import express, { Application, Request, Response } from 'express';
import { sequelize } from './config/db';

// Rutas
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectsRoutes';
import taskRoutes from './routes/taskRoutes';

const app: Application = express();
const PORT = 3000;

app.use(express.json());

// Endpoints
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);

// Test
app.get('/', (req: Request, res: Response) => {
  res.send('🚀 API funcionando');
});

sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexión a la BD establecida');
    app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
  })
  .catch((err: Error) => console.error('❌ Error al conectar la BD:', err));
