import express from 'express';
import { userModel } from './models/userModel';

const app = express();
app.use(express.json());

app.get('/users', async (req, res) => {
  try {
    const users = await userModel.getAll();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const user = await userModel.getById(parseInt(req.params.id));
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
