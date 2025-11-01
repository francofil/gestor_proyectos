import { Sequelize } from 'sequelize';

// CQRS - Master DB (escritura)
export const sequelizeMaster = new Sequelize(
  process.env.DB_NAME || 'gestor_proyectos',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || '1234',
  {
    host: process.env.DB_HOST_MASTER || 'localhost',
    port: Number(process.env.DB_PORT_MASTER) || 5432,
    dialect: 'postgres',
    retry: {
      max: 10
    }
  }
);

// CQRS - Replica DB (lectura)
export const sequelizeReplica = new Sequelize(
  process.env.DB_NAME || 'gestor_proyectos',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || '1234',
  {
    host: process.env.DB_HOST_REPLICA || 'localhost',
    port: Number(process.env.DB_PORT_REPLICA) || 5433,
    dialect: 'postgres',
    retry: {
      max: 10
    }
  }
);

// Exportación por defecto (usa master para compatibilidad)
export const sequelize = sequelizeMaster;
