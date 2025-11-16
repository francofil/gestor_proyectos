import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Token no proporcionado' });
      return;
    }

    // Verificar el token con el Auth Service
    const response = await axios.post(
      `${AUTH_SERVICE}/verify`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.valid) {
      // Agregar información del usuario al request
      (req as any).user = response.data.user;
      next();
    } else {
      res.status(401).json({ error: 'Token inválido' });
    }
  } catch (err: any) {
    res.status(401).json({ error: 'No autorizado' });
  }
};
