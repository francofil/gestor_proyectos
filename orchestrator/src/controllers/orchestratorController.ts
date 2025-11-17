import { Router } from 'express';
import axios from 'axios';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://user-service:3002';
const PROJECT_SERVICE = process.env.PROJECT_SERVICE_URL || 'http://project-service:3003';
const TASK_SERVICE = process.env.TASK_SERVICE_URL || 'http://task-service:3004';

// Auth routes (sin middleware de autenticación)
router.post('/auth/register', async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE}/register`, req.body);
    res.status(201).json(response.data);
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error || err.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE}/login`, req.body);
    res.json(response.data);
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error || err.message });
  }
});

router.post('/auth/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization;
    const response = await axios.post(
      `${AUTH_SERVICE}/logout`,
      {},
      {
        headers: { Authorization: token },
      }
    );
    res.json(response.data);
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error || err.message });
  }
});

// User routes (con middleware de autenticación)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${USER_SERVICE}/users`);
    res.json(response.data);
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

router.get('/users/:id', authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${USER_SERVICE}/users/${req.params.id}`);
    res.json(response.data);
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// Project routes
router.get('/projects', authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${PROJECT_SERVICE}/projects`);
    res.json(response.data);
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

router.get('/projects/:id', authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${PROJECT_SERVICE}/projects/${req.params.id}`);
    res.json(response.data);
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

router.post('/projects', authMiddleware, async (req, res) => {
  try {
    const response = await axios.post(`${PROJECT_SERVICE}/projects`, req.body);
    res.status(201).json(response.data);
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

router.put('/projects/:id', authMiddleware, async (req, res) => {
  try {
    const response = await axios.put(`${PROJECT_SERVICE}/projects/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

router.delete('/projects/:id', authMiddleware, async (req, res) => {
  try {
    await axios.delete(`${PROJECT_SERVICE}/projects/${req.params.id}`);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// Project-User assignment workflow
router.post('/projects/:projectId/assign/:userId', authMiddleware, async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const { role } = req.body;

    // 1. Verificar que el usuario existe
    const userResponse = await axios.get(`${USER_SERVICE}/users/${userId}`);
    if (!userResponse.data) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // 2. Verificar que el proyecto existe
    const projectResponse = await axios.get(`${PROJECT_SERVICE}/projects/${projectId}`);
    if (!projectResponse.data) {
      res.status(404).json({ error: 'Proyecto no encontrado' });
      return;
    }

    // 3. Asignar usuario al proyecto
    const assignmentResponse = await axios.post(
      `${PROJECT_SERVICE}/projects/${projectId}/users/${userId}`,
      { role: role || 'member' }
    );

    res.status(201).json({
      message: 'Usuario asignado al proyecto exitosamente',
      assignment: assignmentResponse.data,
      user: userResponse.data,
      project: projectResponse.data
    });
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ 
      error: err.response?.data?.error || err.message 
    });
  }
});

// Remove user from project
router.delete('/projects/:projectId/assign/:userId', authMiddleware, async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    const response = await axios.delete(
      `${PROJECT_SERVICE}/projects/${projectId}/users/${userId}`
    );

    res.json(response.data);
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ 
      error: err.response?.data?.error || err.message 
    });
  }
});

// Get users assigned to a project
router.get('/projects/:projectId/users', authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${PROJECT_SERVICE}/projects/${req.params.projectId}/users`);
    res.json(response.data);
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// Get projects assigned to a user
router.get('/users/:userId/projects', authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${PROJECT_SERVICE}/users/${req.params.userId}/projects`);
    res.json(response.data);
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// Complex workflow: Create complete project with team and initial tasks
router.post('/projects/complete', authMiddleware, async (req, res) => {
  try {
    const { 
      project,        // { name, description }
      team,           // [{ userId, role }]
      initialTasks    // [{ title, userId }]
    } = req.body;

    // Validaciones básicas
    if (!project?.name) {
      res.status(400).json({ error: 'El nombre del proyecto es requerido' });
      return;
    }

    if (!team || !Array.isArray(team) || team.length === 0) {
      res.status(400).json({ error: 'Debe especificar al menos un miembro del equipo' });
      return;
    }

    const workflow = {
      step: '',
      projectCreated: null as any,
      teamMembers: [] as any[],
      assignmentsCreated: [] as any[],
      tasksCreated: [] as any[],
      errors: [] as any[]
    };

    // PASO 1: Verificar que todos los usuarios del equipo existen
    workflow.step = 'Verificando usuarios del equipo';
    console.log(`[Workflow] ${workflow.step}`);
    
    for (const member of team) {
      try {
        const userResponse = await axios.get(`${USER_SERVICE}/users/${member.userId}`);
        if (userResponse.data) {
          workflow.teamMembers.push({
            ...userResponse.data,
            requestedRole: member.role || 'member'
          });
        }
      } catch (err: any) {
        workflow.errors.push({
          step: 'Verificación de usuario',
          userId: member.userId,
          error: 'Usuario no encontrado'
        });
      }
    }

    // Si algún usuario no existe, abortar
    if (workflow.errors.length > 0) {
      res.status(400).json({
        error: 'Algunos usuarios no existen',
        workflow
      });
      return;
    }

    // PASO 2: Crear el proyecto
    workflow.step = 'Creando proyecto';
    console.log(`[Workflow] ${workflow.step}`);
    
    const projectResponse = await axios.post(`${PROJECT_SERVICE}/projects`, {
      name: project.name,
      description: project.description || ''
    });
    
    workflow.projectCreated = projectResponse.data;
    const projectId = projectResponse.data.id;

    // PASO 3: Asignar todos los usuarios al proyecto
    workflow.step = 'Asignando equipo al proyecto';
    console.log(`[Workflow] ${workflow.step}`);
    
    for (const member of workflow.teamMembers) {
      try {
        const assignmentResponse = await axios.post(
          `${PROJECT_SERVICE}/projects/${projectId}/users/${member.id}`,
          { role: member.requestedRole }
        );
        
        workflow.assignmentsCreated.push({
          user: { id: member.id, name: member.name, email: member.email },
          role: member.requestedRole,
          assignment: assignmentResponse.data
        });
      } catch (err: any) {
        workflow.errors.push({
          step: 'Asignación de usuario',
          userId: member.id,
          error: err.response?.data?.error || err.message
        });
      }
    }

    // PASO 4: Crear tareas iniciales (si se proporcionaron)
    if (initialTasks && Array.isArray(initialTasks) && initialTasks.length > 0) {
      workflow.step = 'Creando tareas iniciales';
      console.log(`[Workflow] ${workflow.step}`);
      
      for (const task of initialTasks) {
        try {
          let assignedUser = null;
          
          // Si hay userId en la tarea, verificar que esté en el equipo
          if (task.userId) {
            const userInTeam = workflow.teamMembers.find(m => m.id === task.userId);
            
            if (!userInTeam) {
              workflow.errors.push({
                step: 'Creación de tarea',
                task: task.title,
                error: 'El usuario asignado a la tarea no está en el equipo'
              });
              continue;
            }
            assignedUser = userInTeam;
          }

          const taskResponse = await axios.post(`${TASK_SERVICE}/tasks`, {
            title: task.title,
            description: task.description,
            status: task.status || 'pending',
            userId: task.userId,
            projectId: projectId
          });
          
          workflow.tasksCreated.push({
            task: taskResponse.data,
            assignedTo: assignedUser ? { id: assignedUser.id, name: assignedUser.name } : null
          });
        } catch (err: any) {
          workflow.errors.push({
            step: 'Creación de tarea',
            task: task.title,
            error: err.response?.data?.error || err.message
          });
        }
      }
    }

    // PASO 5: Preparar respuesta final
    workflow.step = 'Completado';
    
    const summary = {
      success: true,
      message: 'Proyecto completo creado exitosamente',
      project: workflow.projectCreated,
      team: {
        total: workflow.assignmentsCreated.length,
        members: workflow.assignmentsCreated
      },
      tasks: {
        total: workflow.tasksCreated.length,
        items: workflow.tasksCreated
      },
      warnings: workflow.errors.length > 0 ? workflow.errors : undefined
    };

    console.log(`[Workflow] Completado: Proyecto '${project.name}' con ${workflow.assignmentsCreated.length} miembros y ${workflow.tasksCreated.length} tareas`);

    res.status(201).json(summary);
    
  } catch (err: any) {
    console.error('[Workflow] Error crítico:', err.message);
    res.status(500).json({ 
      error: 'Error en el workflow de creación del proyecto',
      details: err.response?.data?.error || err.message 
    });
  }
});

// Complex workflow: Get complete project overview
router.get('/projects/:projectId/overview', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;

    const overview = {
      project: null as any,
      team: [] as any[],
      tasks: [] as any[],
      statistics: {
        totalTeamMembers: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0
      }
    };

    // PASO 1: Obtener información del proyecto
    console.log(`[Overview] Obteniendo información del proyecto ${projectId}`);
    const projectResponse = await axios.get(`${PROJECT_SERVICE}/projects/${projectId}`);
    overview.project = projectResponse.data;

    // PASO 2: Obtener el equipo del proyecto
    console.log(`[Overview] Obteniendo equipo del proyecto ${projectId}`);
    const teamResponse = await axios.get(`${PROJECT_SERVICE}/projects/${projectId}/users`);
    const teamAssignments = teamResponse.data;

    // PASO 3: Para cada miembro del equipo, obtener sus datos completos
    console.log(`[Overview] Obteniendo detalles de ${teamAssignments.length} miembros del equipo`);
    for (const assignment of teamAssignments) {
      try {
        const userResponse = await axios.get(`${USER_SERVICE}/users/${assignment.userId}`);
        overview.team.push({
          ...userResponse.data,
          role: assignment.role
        });
      } catch (err) {
        console.warn(`[Overview] No se pudo obtener información del usuario ${assignment.userId}`);
      }
    }

    // PASO 4: Obtener todas las tareas y filtrar las del proyecto
    console.log(`[Overview] Obteniendo tareas del proyecto ${projectId}`);
    const tasksResponse = await axios.get(`${TASK_SERVICE}/tasks`);
    const allTasks = tasksResponse.data;
    
    // Filtrar tareas del proyecto y enriquecer con información del usuario
    for (const task of allTasks) {
      if (task.projectId === parseInt(projectId)) {
        const assignedUser = overview.team.find(u => u.id === task.userId);
        overview.tasks.push({
          ...task,
          assignedTo: assignedUser ? { 
            id: assignedUser.id, 
            name: assignedUser.name,
            role: assignedUser.role
          } : null
        });
      }
    }

    // PASO 5: Calcular estadísticas
    overview.statistics.totalTeamMembers = overview.team.length;
    overview.statistics.totalTasks = overview.tasks.length;
    overview.statistics.completedTasks = overview.tasks.filter(t => t.completed).length;
    overview.statistics.pendingTasks = overview.tasks.filter(t => !t.completed).length;

    console.log(`[Overview] Completado: ${overview.statistics.totalTeamMembers} miembros, ${overview.statistics.totalTasks} tareas`);

    res.json(overview);
    
  } catch (err: any) {
    console.error('[Overview] Error:', err.message);
    res.status(err.response?.status || 500).json({ 
      error: 'Error al obtener el resumen del proyecto',
      details: err.response?.data?.error || err.message 
    });
  }
});

// Task routes
router.get('/tasks', authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${TASK_SERVICE}/tasks`);
    res.json(response.data);
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

router.get('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${TASK_SERVICE}/tasks/${req.params.id}`);
    res.json(response.data);
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

router.post('/tasks', authMiddleware, async (req, res) => {
  try {
    const response = await axios.post(`${TASK_SERVICE}/tasks`, req.body);
    res.status(201).json(response.data);
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

router.put('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const response = await axios.put(`${TASK_SERVICE}/tasks/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

router.delete('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    await axios.delete(`${TASK_SERVICE}/tasks/${req.params.id}`);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

export { router as orchestratorController };
