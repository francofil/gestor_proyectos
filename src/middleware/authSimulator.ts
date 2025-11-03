import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de simulación de autenticación
 * En un sistema real, esto validaría JWT tokens o sesiones
 */
export class AuthSimulator {
  /**
   * Middleware que simula un usuario autenticado
   * Agrega headers de prueba para simular diferentes roles
   */
  static simulateUser(role: 'admin' | 'developer' | 'tester' | 'designer' | 'guest' = 'guest') {
    return (req: Request, res: Response, next: NextFunction) => {
      // Simular headers de autenticación
      req.headers['authorization'] = 'Bearer simulated-token';
      req.headers['x-user-role'] = role;
      req.headers['x-user-id'] = '1'; // ID del usuario simulado

      console.log(`[AUTH SIMULATOR] Usuario simulado con rol: ${role}`);
      next();
    };
  }

  /**
   * Endpoint para cambiar el rol del usuario en tiempo de ejecución
   * 
   */
  static createRoleChangeEndpoint() {
    return (req: Request, res: Response) => {
      const { role } = req.body;
      const validRoles = ['admin', 'developer', 'tester', 'designer', 'guest'];
      
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: 'Rol inválido',
          validRoles 
        });
      }

      res.json({ 
        message: `Rol cambiado a: ${role}`,
        instructions: 'Agrega el header "x-user-role: ' + role + '" a tus próximas solicitudes'
      });
    };
  }
}