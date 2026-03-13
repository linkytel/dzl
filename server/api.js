import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, '..', 'data');

app.use(cors());
app.use(express.json());

// Helper: read JSON file
function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf-8');
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

// Helper: write JSON file
function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ── Users ──────────────────────────────────────────

// GET /api/users
app.get('/api/users', (req, res) => {
  const users = readJSON('users.json');
  // Don't expose passwords
  const safeUsers = users.map(({ password, ...rest }) => rest);
  res.json(safeUsers);
});

// POST /api/users — create user
app.post('/api/users', (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ error: '姓名和密码不能为空' });
  }
  const users = readJSON('users.json');
  const existing = users.find((u) => u.name === name);
  if (existing) {
    return res.status(409).json({ error: '用户名已存在' });
  }
  const user = {
    id: randomUUID(),
    name,
    password,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeJSON('users.json', users);
  const { password: _, ...safeUser } = user;
  res.status(201).json(safeUser);
});

// POST /api/auth — login
app.post('/api/auth', (req, res) => {
  const { name, password } = req.body;
  const users = readJSON('users.json');
  const user = users.find((u) => u.name === name && u.password === password);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// ── Todos ──────────────────────────────────────────

// GET /api/todos
app.get('/api/todos', (req, res) => {
  const todos = readJSON('todos.json');
  res.json(todos);
});

// POST /api/todos
app.post('/api/todos', (req, res) => {
  const { title, description, category, createdBy } = req.body;
  if (!title) {
    return res.status(400).json({ error: '标题不能为空' });
  }
  const now = new Date().toISOString();
  const todo = {
    id: randomUUID(),
    title,
    description: description || '',
    status: 'pending',
    category: category || '未分类',
    createdBy: createdBy || 'unknown',
    createdAt: now,
    updatedAt: now,
  };
  const todos = readJSON('todos.json');
  todos.push(todo);
  writeJSON('todos.json', todos);
  res.status(201).json(todo);
});

// PUT /api/todos/:id
app.put('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const todos = readJSON('todos.json');
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '未找到该 Todo' });
  }
  todos[index] = {
    ...todos[index],
    ...updates,
    id: todos[index].id,
    createdAt: todos[index].createdAt,
    updatedAt: new Date().toISOString(),
  };
  writeJSON('todos.json', todos);
  res.json(todos[index]);
});

// DELETE /api/todos/:id
app.delete('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  let todos = readJSON('todos.json');
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '未找到该 Todo' });
  }
  todos.splice(index, 1);
  writeJSON('todos.json', todos);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`📦 WiGS API server running on http://localhost:${PORT}`);
});
