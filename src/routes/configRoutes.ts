import { Router, Request, Response } from 'express';
import { getConfig } from '../config/externalConfig';
import fs from 'fs';
import path from 'path';

const router = Router();
const CONFIG_FILE = path.join(__dirname, '../../config.json');

// GET - Ver configuración actual
router.get('/', (req: Request, res: Response) => {
  try {
    const config = getConfig();
    res.json({
      message: 'Configuración actual del sistema',
      config
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Error al leer configuración',
      message: error.message
    });
  }
});

// PUT - Actualizar configuración
router.put('/', (req: Request, res: Response) => {
  try {
    const newConfig = req.body;
    
    // Validar estructura mínima
    if (!newConfig.database || !newConfig.server || !newConfig.retry || !newConfig.features) {
      return res.status(400).json({
        error: 'Configuración incompleta',
        message: 'Debe incluir: database, server, retry y features'
      });
    }
    
    // Escribir nueva configuración
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf-8');
    
    res.json({
      message: 'Configuración actualizada exitosamente',
      config: newConfig
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Error al actualizar configuración',
      message: error.message
    });
  }
});

// PATCH - Actualizar configuración parcialmente
router.patch('/', (req: Request, res: Response) => {
  try {
    // Leer config actual
    const currentConfig = getConfig();
    const updates = req.body;
    
    // Merge profundo solo de las propiedades válidas
    const updatedConfig = {
      database: updates.database 
        ? { ...currentConfig.database, ...updates.database }
        : currentConfig.database,
      server: updates.server 
        ? { ...currentConfig.server, ...updates.server }
        : currentConfig.server,
      retry: updates.retry 
        ? { ...currentConfig.retry, ...updates.retry }
        : currentConfig.retry,
      features: updates.features 
        ? { ...currentConfig.features, ...updates.features }
        : currentConfig.features
    };
    
    // Escribir configuración actualizada
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updatedConfig, null, 2), 'utf-8');
    
    res.json({
      message: 'Configuración actualizada parcialmente',
      config: updatedConfig
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Error al actualizar configuración',
      message: error.message
    });
  }
});

export default router;
