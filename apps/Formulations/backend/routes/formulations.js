import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, '../data/formulations.json');

// Ensure data directory and file exist
const ensureDataFile = () => {
  const dataDir = path.dirname(dataFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2));
  }
};

ensureDataFile();

// Helper functions
const readFormulations = () => {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading formulations:', error);
    return [];
  }
};

const writeFormulations = (formulations) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(formulations, null, 2));
  } catch (error) {
    console.error('Error writing formulations:', error);
  }
};

// Routes

// GET all formulations
router.get('/', (req, res) => {
  try {
    const formulations = readFormulations();
    res.json(formulations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch formulations' });
  }
});

// GET single formulation by ID
router.get('/:id', (req, res) => {
  try {
    const formulations = readFormulations();
    const formulation = formulations.find(f => f.id === req.params.id);
    if (!formulation) {
      return res.status(404).json({ error: 'Formulation not found' });
    }
    res.json(formulation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch formulation' });
  }
});

// POST - Create new formulation
router.post('/', (req, res) => {
  try {
    const formulations = readFormulations();
    const newFormulation = {
      ...req.body,
      id: uuidv4(),
      createdDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    formulations.push(newFormulation);
    writeFormulations(formulations);
    res.status(201).json(newFormulation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create formulation' });
  }
});

// PUT - Update formulation
router.put('/:id', (req, res) => {
  try {
    const formulations = readFormulations();
    const index = formulations.findIndex(f => f.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Formulation not found' });
    }
    const updatedFormulation = {
      ...formulations[index],
      ...req.body,
      id: req.params.id,
      createdDate: formulations[index].createdDate,
      updatedAt: new Date().toISOString(),
    };
    formulations[index] = updatedFormulation;
    writeFormulations(formulations);
    res.json(updatedFormulation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update formulation' });
  }
});

// DELETE formulation
router.delete('/:id', (req, res) => {
  try {
    let formulations = readFormulations();
    const index = formulations.findIndex(f => f.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Formulation not found' });
    }
    formulations.splice(index, 1);
    writeFormulations(formulations);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete formulation' });
  }
});

// POST - Duplicate formulation
router.post('/:id/duplicate', (req, res) => {
  try {
    const formulations = readFormulations();
    const original = formulations.find(f => f.id === req.params.id);
    if (!original) {
      return res.status(404).json({ error: 'Formulation not found' });
    }
    const duplicate = {
      ...original,
      id: uuidv4(),
      name: `${original.name} (Copy)`,
      createdDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    formulations.push(duplicate);
    writeFormulations(formulations);
    res.status(201).json(duplicate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to duplicate formulation' });
  }
});

export default router;
