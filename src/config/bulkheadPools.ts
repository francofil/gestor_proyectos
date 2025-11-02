import { Sequelize } from 'sequelize';
import { getConfig } from './externalConfig';

/**
 * Patrón Bulkhead: Pools de conexión independientes por módulo.
 * Cada módulo tiene su propio pool para aislar recursos y prevenir fallos en cascada.
 */

// POOLS PARA USUARIOS
export const usersMasterPool = new Sequelize(
  process.env.DB_NAME || 'gestor_proyectos',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || '1234',
  {
    host: process.env.DB_HOST_MASTER || 'localhost',
    port: Number(process.env.DB_PORT_MASTER) || 5432,
    dialect: 'postgres',
    logging: false,
    pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
    retry: { max: 5 }
  }
);

export const usersReplicaPool = new Sequelize(
  process.env.DB_NAME || 'gestor_proyectos',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || '1234',
  {
    host: process.env.DB_HOST_REPLICA || 'localhost',
    port: Number(process.env.DB_PORT_REPLICA) || 5433,
    dialect: 'postgres',
    logging: false,
    pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
    retry: { max: 5 }
  }
);

// POOLS PARA PROYECTOS
export const projectsMasterPool = new Sequelize(
  process.env.DB_NAME || 'gestor_proyectos',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || '1234',
  {
    host: process.env.DB_HOST_MASTER || 'localhost',
    port: Number(process.env.DB_PORT_MASTER) || 5432,
    dialect: 'postgres',
    logging: false,
    pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
    retry: { max: 5 }
  }
);

export const projectsReplicaPool = new Sequelize(
  process.env.DB_NAME || 'gestor_proyectos',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || '1234',
  {
    host: process.env.DB_HOST_REPLICA || 'localhost',
    port: Number(process.env.DB_PORT_REPLICA) || 5433,
    dialect: 'postgres',
    logging: false,
    pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
    retry: { max: 5 }
  }
);

// POOLS PARA TAREAS
export const tasksMasterPool = new Sequelize(
  process.env.DB_NAME || 'gestor_proyectos',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || '1234',
  {
    host: process.env.DB_HOST_MASTER || 'localhost',
    port: Number(process.env.DB_PORT_MASTER) || 5432,
    dialect: 'postgres',
    logging: false,
    pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
    retry: { max: 5 }
  }
);

export const tasksReplicaPool = new Sequelize(
  process.env.DB_NAME || 'gestor_proyectos',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || '1234',
  {
    host: process.env.DB_HOST_REPLICA || 'localhost',
    port: Number(process.env.DB_PORT_REPLICA) || 5433,
    dialect: 'postgres',
    logging: false,
    pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
    retry: { max: 5 }
  }
);

// POOL PARA ESTADÍSTICAS (solo lectura)
export const statisticsReplicaPool = new Sequelize(
  process.env.DB_NAME || 'gestor_proyectos',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || '1234',
  {
    host: process.env.DB_HOST_REPLICA || 'localhost',
    port: Number(process.env.DB_PORT_REPLICA) || 5433,
    dialect: 'postgres',
    logging: false,
    pool: { max: 5, min: 1, acquire: 30000, idle: 10000 },
    retry: { max: 5 }
  }
);

console.log('✅ Pools de Bulkhead inicializados correctamente');
console.log('   - Users: max 10 conexiones');
console.log('   - Projects: max 10 conexiones');
console.log('   - Tasks: max 10 conexiones');
console.log('   - Statistics: max 5 conexiones');

export const getPoolForModule = (module: 'users' | 'projects' | 'tasks' | 'statistics', operation: 'read' | 'write' = 'read') => {
  switch (module) {
    case 'users':
      return operation === 'write' ? usersMasterPool : usersReplicaPool;
    case 'projects':
      return operation === 'write' ? projectsMasterPool : projectsReplicaPool;
    case 'tasks':
      return operation === 'write' ? tasksMasterPool : tasksReplicaPool;
    case 'statistics':
      return statisticsReplicaPool;
    default:
      throw new Error(`Módulo desconocido: ${module}`);
  }
};
