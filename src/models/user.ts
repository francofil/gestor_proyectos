import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

// Definir la interfaz User
interface UserAttributes {
  id: number;
  name: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Para creación, "id" es opcional
interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

// Clase User que extiende Model de Sequelize
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  }
}, {
  sequelize,
  tableName: 'users',
  timestamps: true
});

export default User;
