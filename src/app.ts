import express, { Application, Request, Response } from 'express';
import { sequelizeMaster, sequelizeReplica } from './config/db';
import { configReloadMiddleware } from './middleware/configReload';
import { getConfig } from './config/externalConfig';

// Rutas
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectsRoutes';
import taskRoutes from './routes/taskRoutes';
import statisticsRoutes from './routes/statisticsRoutes';
import configRoutes from './routes/configRoutes';

const app: Application = express();

app.use(express.json());

// Middleware para recargar configuración en cada request
app.use(configReloadMiddleware);

// Endpoints
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/statistics', statisticsRoutes);
app.use('/config', configRoutes);

// Test
app.get('/', (req: Request, res: Response) => {
  res.send('🚀 API funcionando con Master-Replica CQRS');
});

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    await sequelizeMaster.authenticate();
    await sequelizeReplica.authenticate();
    res.json({
      status: 'healthy',
      master: 'connected',
      replica: 'connected'
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: err.message
    });
  }
});

// Función para conectar con reintentos
async function connectWithRetry(maxRetries = 10, delay = 3000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await sequelizeMaster.authenticate();
      console.log('✅ Conexión a BD MASTER establecida');
      
      await sequelizeReplica.authenticate();
      console.log('✅ Conexión a BD REPLICA establecida');
      
      return true;
    } catch (err: any) {
      console.log(`⚠️  Intento ${i + 1}/${maxRetries} fallido: ${err.message}`);
      if (i < maxRetries - 1) {
        console.log(`⏳ Reintentando en ${delay/1000} segundos...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('No se pudo conectar a las bases de datos después de múltiples intentos');
}

// Conectar ambas bases de datos
connectWithRetry()
  .then(() => {
    const config = getConfig();
    app.listen(config.server.port, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${config.server.port}`);
      console.log(`📋 Configuración externa cargada desde config.json`);
    });
  })
  .catch((err: Error) => {
    console.error('❌ Error fatal al conectar la BD:', err);
    process.exit(1);
  });
