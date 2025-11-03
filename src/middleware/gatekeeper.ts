import { Request, Response, NextFunction } from 'express';

// Tipos de roles permitidos
type UserRole = 'admin' | 'developer' | 'tester' | 'designer' | 'guest';

// Configuración de permisos por endpoint
interface EndpointPermission {
  method: string;
  path: RegExp;
  allowedRoles: UserRole[];
  requireAuth: boolean;
}

// Configuración de seguridad por endpoints
const ENDPOINT_PERMISSIONS: EndpointPermission[] = [
  // Endpoints públicos (solo lectura básica)
  { method: 'GET', path: /^\/users$/, allowedRoles: ['admin', 'developer', 'tester', 'designer'], requireAuth: true },
  { method: 'GET', path: /^\/projects$/, allowedRoles: ['admin', 'developer', 'tester', 'designer'], requireAuth: true },
  { method: 'GET', path: /^\/tasks$/, allowedRoles: ['admin', 'developer', 'tester', 'designer'], requireAuth: true },
  
  // Endpoints de creación (solo admin y developers)
  { method: 'POST', path: /^\/users$/, allowedRoles: ['admin'], requireAuth: true },
  { method: 'POST', path: /^\/projects$/, allowedRoles: ['admin', 'developer'], requireAuth: true },
  { method: 'POST', path: /^\/tasks$/, allowedRoles: ['admin', 'developer'], requireAuth: true },
  
  // Endpoints de modificación (admin y developers)
  { method: 'PUT', path: /^\/projects\/\d+$/, allowedRoles: ['admin', 'developer'], requireAuth: true },
  { method: 'PUT', path: /^\/tasks\/\d+$/, allowedRoles: ['admin', 'developer'], requireAuth: true },
  
  // Endpoints de eliminación (solo admin)
  { method: 'DELETE', path: /^\/users\/\d+$/, allowedRoles: ['admin'], requireAuth: true },
  { method: 'DELETE', path: /^\/projects\/\d+$/, allowedRoles: ['admin'], requireAuth: true },
  { method: 'DELETE', path: /^\/tasks\/\d+$/, allowedRoles: ['admin'], requireAuth: true },
  
  // Endpoints específicos de proyectos
  { method: 'GET', path: /^\/projects\/\d+\/tasks$/, allowedRoles: ['admin', 'developer', 'tester'], requireAuth: true },
  { method: 'GET', path: /^\/projects\/\d+\/tasks\/pending$/, allowedRoles: ['admin', 'developer', 'tester'], requireAuth: true },
  { method: 'GET', path: /^\/users\/\d+\/tasks$/, allowedRoles: ['admin', 'developer', 'tester'], requireAuth: true },
  
  // Endpoint de salud (público)
  { method: 'GET', path: /^\/$/, allowedRoles: ['admin', 'developer', 'tester', 'designer', 'guest'], requireAuth: false },
];

// Lista de IPs bloqueadas, simulamos cualquier ip
const BLOCKED_IPS: string[] = [
  '192.168.1.100',
  '10.0.0.5'
];

// Límite de rate limiting (solicitudes por minuto por IP)
const RATE_LIMIT_MAP = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 100; // máximo 100 requests por minuto
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto en milliseconds

export class GatekeeperMiddleware {
  /**
   * Middleware principal del Gatekeeper
   * Valida y sanitiza todas las solicitudes antes de permitir acceso
   */
  static validate(req: Request, res: Response, next: NextFunction): void {
    console.log(` [GATEKEEPER] ${req.method} ${req.path} - IP: ${req.ip}`);

    try {
      // 1. Validación de IP bloqueadas
      if (!GatekeeperMiddleware.validateIP(req, res)) return;

      // 2. Rate limiting
      if (!GatekeeperMiddleware.checkRateLimit(req, res)) return;

      // 3. Sanitización de entrada
      GatekeeperMiddleware.sanitizeInput(req);

      // 4. Validación de permisos
      if (!GatekeeperMiddleware.validatePermissions(req, res)) return;

      // 5. Logging de acceso
      GatekeeperMiddleware.logAccess(req);

      console.log(` [GATEKEEPER] Solicitud autorizada`);
      next();
    } catch (error) {
      console.error(` [GATEKEEPER] Error interno:`, error);
      res.status(500).json({ 
        error: 'Error interno del gateway',
        code: 'GATEKEEPER_ERROR'
      });
    }
  }

  /**
   * Validar si la IP está en la lista de bloqueadas
   */
  private static validateIP(req: Request, res: Response): boolean {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (BLOCKED_IPS.includes(clientIP)) {
      console.log(`[GATEKEEPER] IP bloqueada: ${clientIP}`);
      res.status(403).json({ 
        error: 'Acceso denegado desde esta IP',
        code: 'IP_BLOCKED'
      });
      return false;
    }
    return true;
  }

  /**
   * Control de rate limiting por IP
   */
  private static checkRateLimit(req: Request, res: Response): boolean {
    const clientIP = req.ip || 'unknown';
    const now = Date.now();
    const clientData = RATE_LIMIT_MAP.get(clientIP);

    if (!clientData) {
      RATE_LIMIT_MAP.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      return true;
    }

    if (now > clientData.resetTime) {
      // Reset del contador
      RATE_LIMIT_MAP.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      return true;
    }

    if (clientData.count >= RATE_LIMIT_REQUESTS) {
      console.log(` [GATEKEEPER] Rate limit excedido para IP: ${clientIP}`);
      res.status(429).json({ 
        error: 'Demasiadas solicitudes. Intente más tarde.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
      return false;
    }

    clientData.count++;
    return true;
  }

  /**
   * Sanitización de datos de entrada
   */
  private static sanitizeInput(req: Request): void {
    // Sanitizar parámetros de ruta
    if (req.params) {
      Object.keys(req.params).forEach(key => {
        if (typeof req.params[key] === 'string') {
          req.params[key] = req.params[key].trim().replace(/[<>]/g, '');
        }
      });
    }

    // Sanitizar query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = (req.query[key] as string).trim().replace(/[<>]/g, '');
        }
      });
    }

    // Sanitizar body (básico)
    if (req.body && typeof req.body === 'object') {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim().replace(/[<>]/g, '');
        }
      });
    }
  }

  /**
   * Validar permisos del endpoint
   */
  private static validatePermissions(req: Request, res: Response): boolean {
    const method = req.method;
    const path = req.path;

    // Buscar la configuración del endpoint
    const endpointConfig = ENDPOINT_PERMISSIONS.find(config => 
      config.method === method && config.path.test(path) //el test verifica si la path ingresada coincide con alguna de los endpoints configurados, retorna true o false
    );

    if (!endpointConfig) {
      console.log(` [GATEKEEPER] Endpoint no configurado: ${method} ${path}`);
      res.status(404).json({ 
        error: 'Endpoint no encontrado',
        code: 'ENDPOINT_NOT_FOUND'
      });
      return false;
    }

    // Si requiere autenticación, validar usuario
    if (endpointConfig.requireAuth) {
      const userRole = GatekeeperMiddleware.extractUserRole(req);
      
      if (!userRole) {
        console.log(` [GATEKEEPER] Usuario no autenticado`);
        res.status(401).json({ 
          error: 'Autenticación requerida',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return false;
      }

      if (!endpointConfig.allowedRoles.includes(userRole)) {
        console.log(` [GATEKEEPER] Rol insuficiente: ${userRole} para ${method} ${path}`);
        res.status(403).json({ 
          error: 'Permisos insuficientes para este recurso',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: endpointConfig.allowedRoles
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Extraer rol del usuario desde headers
   * En un sistema real, esto vendría de un JWT o sesión
   */
  private static extractUserRole(req: Request): UserRole | null {
    // Simular extracción de rol desde header
    const roleHeader = req.headers['x-user-role'] as string;
    const authHeader = req.headers['authorization'] as string;
    
    // Si no hay authorization header y se requiere auth
    if (!authHeader && !roleHeader) {
      return null;
    }

    // Simular roles válidos
    const validRoles: UserRole[] = ['admin', 'developer', 'tester', 'designer', 'guest'];
    const role = (roleHeader || 'guest') as UserRole;
    
    return validRoles.includes(role) ? role : 'guest';
  }

  /**
   * Logging de accesos para auditoría
   */
  private static logAccess(req: Request): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userRole: req.headers['x-user-role'] || 'guest'
    };
    
    console.log(`📋 [GATEKEEPER] Acceso registrado:`, logEntry);
    // Aquí podrías enviar a un sistema de logging externo
  }
}