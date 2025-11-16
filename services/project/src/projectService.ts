import express from 'express';
import { projectModel } from './models/projectModel';

const app = express();
app.use(express.json());

app.get('/projects', async (req, res) => {
  try {
    const projects = await projectModel.getAll();
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/projects/:id', async (req, res) => {
  try {
    const project = await projectModel.getById(parseInt(req.params.id));
    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado' });
      return;
    }
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/projects', async (req, res) => {
  try {
    const project = await projectModel.create(req.body);
    res.status(201).json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/projects/:id', async (req, res) => {
  try {
    const project = await projectModel.update(parseInt(req.params.id), req.body);
    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado' });
      return;
    }
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/projects/:id', async (req, res) => {
  try {
    const deleted = await projectModel.delete(parseInt(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Proyecto no encontrado' });
      return;
    }
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Asignar usuario a proyecto
app.post('/projects/:projectId/users/:userId', async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const { role } = req.body;
    
    const assignment = await projectModel.assignUserToProject(
      parseInt(projectId),
      parseInt(userId),
      role || 'member'
    );
    
    res.status(201).json(assignment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Remover usuario de proyecto
app.delete('/projects/:projectId/users/:userId', async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    
    const result = await projectModel.removeUserFromProject(
      parseInt(projectId),
      parseInt(userId)
    );
    
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// Obtener usuarios de un proyecto
app.get('/projects/:projectId/users', async (req, res) => {
  try {
    const users = await projectModel.getProjectUsers(parseInt(req.params.projectId));
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener proyectos de un usuario
app.get('/users/:userId/projects', async (req, res) => {
  try {
    const projects = await projectModel.getUserProjects(parseInt(req.params.userId));
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Project Service running on port ${PORT}`);
});
