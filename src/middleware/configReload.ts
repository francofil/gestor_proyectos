import { Request, Response, NextFunction } from 'express';
import { getConfig } from '../config/externalConfig';

/**
 * Middleware que recarga la configuración en cada request
 * Permite cambios en caliente del archivo config.json
 */
export const configReloadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = getConfig();
    
    res.locals.config = config;
    
    if (config.features.enableLogging) {
      console.log(`Config recargada para ${req.method} ${req.path}`);
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      error: 'Error al cargar configuración',
      message: error.message
    });
  }
};
