import express from 'express';
import { orchestratorController } from './controllers/orchestratorController';

const app = express();
app.use(express.json());

app.use('/api', orchestratorController);

app.get('/', (req, res) => {
  res.send('🚀 Orchestrator funcionando');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Orchestrator Service running on port ${PORT}`);
});
