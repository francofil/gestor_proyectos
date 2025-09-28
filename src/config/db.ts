import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize(
  process.env.DB_NAME || 'gestor_proyectos',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASS || '1234',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    retry: {
      max: 10 // intenta 10 veces antes de fallar
    }
  }
);
