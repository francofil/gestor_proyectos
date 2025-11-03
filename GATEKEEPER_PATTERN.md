# Patrón Gatekeeper - Documentación

## Descripción del Patrón

El **Patrón Gatekeeper** implementado en este proyecto actúa como un **punto de entrada seguro** que valida, filtra y controla todas las solicitudes antes de permitir el acceso a los recursos internos.

## Arquitectura Implementada

```
Cliente → Gatekeeper → Servicios Internos → Base de Datos
           ↓
    [Validación & Filtrado]
```

### Componentes:

1. **GatekeeperMiddleware** (`src/middleware/gatekeeper.ts`)
   - Punto de entrada único para todas las solicitudes
   - Validación de seguridad multinivel
   - Control de acceso basado en roles

2. **AuthSimulator** (`src/middleware/authSimulator.ts`)
   - Simulador de autenticación para testing
   - Gestión de roles de usuario

## 🛡️ Funcionalidades de Seguridad

### 1. **Validación de IPs**
- Lista negra de IPs bloqueadas (pusimos ips de ejemplos x)
- Bloqueo automático de direcciones maliciosas

### 2. **Rate Limiting**
- Máximo 100 solicitudes por minuto por IP
- Protección contra ataques de fuerza bruta

### 3. **Control de Permisos por Rol** (porque el gatekeeper valida por roles)
- **admin**: Acceso total (CRUD completo)
- **developer**: Crear/leer/actualizar proyectos y tareas
- **tester**: Solo lectura de recursos
- **designer**: Solo lectura de recursos
- **guest**: Solo endpoint público

### 4. **Sanitización de Entrada** 

- Limpieza de parámetros de ruta
- Filtrado de caracteres peligrosos
- Validación de datos de entrada

### 5. **Logging y Auditoría**
- Registro completo de accesos
- Tracking de IPs y user agents
- Historial de solicitudes

## 🚀 Uso y Testing

### Configuración de Roles

Para probar diferentes roles, agrega el header en tus solicitudes:

```bash
# Como administrador
curl -H "x-user-role: admin" -H "authorization: Bearer token" http://localhost:3000/users

# Como developer
curl -H "x-user-role: developer" -H "authorization: Bearer token" http://localhost:3000/projects

# Como tester (solo lectura)
curl -H "x-user-role: tester" -H "authorization: Bearer token" http://localhost:3000/tasks
```

## 🧪 Casos de Prueba

### 1. Acceso Denegado por Rol
```bash
# Intentar crear usuario como tester (debería fallar)
curl -X POST http://localhost:3000/users \
  -H "x-user-role: tester" \
  -H "authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "email": "test@example.com"}'
```

### 3. IP Bloqueada
- Configura tu IP en BLOCKED_IPS y verifica el bloqueo

## 📊 Beneficios del Patrón

✅ **Seguridad Centralizada**: Un solo punto para validar todas las solicitudes, centralizamos las politicas que necesite el sistema
✅ **Control Granular**: Permisos específicos por rol y endpoint, denegamos los accesos dependiendo del rol
✅ **Escalabilidad**: Fácil agregar nuevas reglas de seguridad
✅ **Auditoría**: Logging completo de accesos
✅ **Flexibilidad**: Configuración dinámica de permisos
✅ **Mantenibilidad**: Lógica de seguridad separada del negocio (Importante para modularizar)
