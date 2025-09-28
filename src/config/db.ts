import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize('gestor_db', 'postgres', 'postgres', {
  host: 'localhost', // cambiar a 'db' si usás Docker
  dialect: 'postgres'
});