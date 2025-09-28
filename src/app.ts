import express, { Application, Request, Response } from 'express';
import { sequelize } from './config/db';
import userRoutes from './routes/userRoutes';

const app: Application = express();
const PORT = 3000;

app.use(express.json());

// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
  res.send('🚀 API con Node.js + Express + TypeScript funcionando');
});

// Rutas de usuarios
app.use('/users', userRoutes);

// Conectar DB y levantar server
sequelize.sync()
  .then(() => {
    console.log('✅ Base de datos sincronizada');
    app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
  })
  .catch((err: Error) => console.error('❌ Error conectando a BD:', err));
