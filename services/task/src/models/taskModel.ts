import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './config/db';

interface TaskAttributes {
  id: number;
  title: string;
  description?: string;
  status: string;
  userId?: number;
  projectId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'status' | 'userId'> {}

class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: number;
  public title!: string;
  public description?: string;
  public status!: string;
  public userId?: number;
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'pending',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    underscored: true,
  }
);

export const taskModel = {
  async getAll() {
    const tasks = await Task.findAll();
    return tasks;
  },

  async getById(id: number) {
    const task = await Task.findByPk(id);
    return task;
  },

  async create(taskData: any) {
    const { title, description, status, userId, projectId } = taskData;
    const task = await Task.create({ 
      title, 
      description, 
      status: status || 'pending',
      userId, 
      projectId 
    } as any);
    return task;
  },

  async update(id: number, taskData: any) {
    const [updated] = await Task.update(taskData, { where: { id } });
    if (!updated) return null;
    const task = await Task.findByPk(id);
    return task;
  },

  async delete(id: number) {
    const deleted = await Task.destroy({ where: { id } });
    return deleted > 0;
  }
};
