import { Sequelize } from 'sequelize';

// Conexión MASTER (escritura - Commands)
export const sequelizeMaster = new Sequelize(
  process.env.DB_NAME || 'gestor_proyectos',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || '1234',
  {
    host: process.env.DB_MASTER_HOST || 'localhost',
    port: Number(process.env.DB_MASTER_PORT) || 5432,
    dialect: 'postgres',
    retry: {
      max: 10
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: console.log
  }
);

// Conexión REPLICA (lectura - Queries)
export const sequelizeReplica = new Sequelize(
  process.env.DB_NAME || 'gestor_proyectos',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || '1234',
  {
    host: process.env.DB_REPLICA_HOST || 'localhost',
    port: Number(process.env.DB_REPLICA_PORT) || 5432,
    dialect: 'postgres',
    retry: {
      max: 10
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: console.log
  }
);

// Mantener compatibilidad con código existente
export const sequelize = sequelizeMaster;
