import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './config/db';

interface ProjectAttributes {
  id: number;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id'> {}

class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Project.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
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
    tableName: 'projects',
    timestamps: true,
    underscored: true,
  }
);

interface ProjectUserAttributes {
  userId: number;
  projectId: number;
  role: string;
}

class ProjectUser extends Model<ProjectUserAttributes> implements ProjectUserAttributes {
  public userId!: number;
  public projectId!: number;
  public role!: string;
}

ProjectUser.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'user_id',
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'project_id',
    },
    role: {
      type: DataTypes.STRING(50),
      defaultValue: 'member',
    },
  },
  {
    sequelize,
    tableName: 'project_users',
    timestamps: false,
  }
);

export const projectModel = {
  async getAll() {
    const projects = await Project.findAll();
    return projects;
  },

  async getById(id: number) {
    const project = await Project.findByPk(id);
    return project;
  },

  async create(projectData: any) {
    const { name, description } = projectData;
    const project = await Project.create({ name, description });
    return project;
  },

  async update(id: number, projectData: any) {
    const [updated] = await Project.update(projectData, { where: { id } });
    if (!updated) return null;
    const project = await Project.findByPk(id);
    return project;
  },

  async delete(id: number) {
    const deleted = await Project.destroy({ where: { id } });
    return deleted > 0;
  },

  async assignUserToProject(projectId: number, userId: number, role: string = 'member') {
    // Verificar si ya existe la asignación
    const existing = await ProjectUser.findOne({
      where: { projectId, userId }
    });

    if (existing) {
      throw new Error('El usuario ya está asignado a este proyecto');
    }

    const assignment = await ProjectUser.create({
      projectId,
      userId,
      role,
    } as any);

    return assignment;
  },

  async removeUserFromProject(projectId: number, userId: number) {
    const deleted = await ProjectUser.destroy({
      where: { projectId, userId }
    });

    if (deleted === 0) {
      throw new Error('Asignación no encontrada');
    }

    return { message: 'Usuario removido del proyecto' };
  },

  async getProjectUsers(projectId: number) {
    const users = await ProjectUser.findAll({
      where: { projectId }
    });
    return users;
  },

  async getUserProjects(userId: number) {
    const projects = await ProjectUser.findAll({
      where: { userId }
    });
    return projects;
  }
};
