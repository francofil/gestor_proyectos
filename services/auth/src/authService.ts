import express from 'express';
import { authModel } from './models/authModel';

const app = express();
app.use(express.json());

app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Todos los campos son requeridos' });
      return;
    }

    const user = await authModel.register({ name, email, password });
    res.status(201).json({ 
      message: 'Usuario registrado exitosamente',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña son requeridos' });
      return;
    }

    const result = await authModel.login({ email, password });
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

app.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(400).json({ error: 'Token no proporcionado' });
      return;
    }

    await authModel.logout(token);
    res.json({ message: 'Logout exitoso' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ error: 'Token no proporcionado' });
      return;
    }

    const decoded = await authModel.verifyToken(token);
    res.json({ valid: true, user: decoded });
  } catch (err: any) {
    res.status(401).json({ error: err.message, valid: false });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});
