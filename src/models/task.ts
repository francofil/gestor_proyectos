import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

interface TaskAttributes {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
  projectId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'completed'> {}

class Task extends Model<TaskAttributes, TaskCreationAttributes>
  implements TaskAttributes {
  public id!: number;
  public title!: string;
  public completed!: boolean;
  public userId!: number;
  public projectId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'project_id'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    tableName: 'tasks',
    timestamps: true,
  }
);

export default Task;
