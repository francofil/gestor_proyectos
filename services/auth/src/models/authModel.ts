import { DataTypes, Model } from 'sequelize';
import { sequelize } from './config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambialo_en_produccion';

interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
}

interface TokenBlacklistAttributes {
  id: number;
  token: string;
  userId: number;
  blacklistedAt?: Date;
}

class User extends Model<UserAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
}

class TokenBlacklist extends Model<TokenBlacklistAttributes> implements TokenBlacklistAttributes {
  public id!: number;
  public token!: string;
  public userId!: number;
  public blacklistedAt?: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
  }
);

TokenBlacklist.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    blacklistedAt: {
      type: DataTypes.DATE,
      field: 'blacklisted_at',
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'token_blacklist',
    timestamps: false,
  }
);

export const authModel = {
  async register(userData: { name: string; email: string; password: string }) {
    const { name, email, password } = userData;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    } as any);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  },

  async login(credentials: { email: string; password: string }) {
    const { email, password } = credentials;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar la contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  },

  async logout(token: string) {
    try {
      // Decodificar el token para obtener el user_id
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Agregar el token a la blacklist
      await TokenBlacklist.create({
        token,
        userId: decoded.id,
      } as any);

      return { message: 'Token agregado a blacklist' };
    } catch (error) {
      throw new Error('Token inválido');
    }
  },

  async verifyToken(token: string) {
    // Verificar si el token está en la blacklist
    const blacklisted = await TokenBlacklist.findOne({ where: { token } });
    if (blacklisted) {
      throw new Error('Token inválido (logout previo)');
    }

    // Verificar el token JWT
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  },
};
