import express from 'express';
import { taskModel } from './models/taskModel';

const app = express();
app.use(express.json());

app.get('/tasks', async (req, res) => {
  try {
    const tasks = await taskModel.getAll();
    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/tasks/:id', async (req, res) => {
  try {
    const task = await taskModel.getById(parseInt(req.params.id));
    if (!task) {
      res.status(404).json({ error: 'Tarea no encontrada' });
      return;
    }
    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/tasks', async (req, res) => {
  try {
    const task = await taskModel.create(req.body);
    res.status(201).json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/tasks/:id', async (req, res) => {
  try {
    const task = await taskModel.update(parseInt(req.params.id), req.body);
    if (!task) {
      res.status(404).json({ error: 'Tarea no encontrada' });
      return;
    }
    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  try {
    const deleted = await taskModel.delete(parseInt(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Tarea no encontrada' });
      return;
    }
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Task Service running on port ${PORT}`);
});
