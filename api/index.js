import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const USE_DB = !!DB_URL;

app.use(cors());
app.use(express.json());

// ── 动态导入数据库模块 ─────────────────────────────
let db = null;
if (USE_DB) {
  db = await import('./db.js');
  await db.initDB();
  console.log('🗄️  Using Neon Postgres database');
} else {
  console.log('📁 Using local JSON file storage');
}

// ── 本地文件存储 helpers ──────────────────────────
const DATA_DIR = path.join(process.cwd(), 'data');

function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) {
      if (filename === 'projects.json') {
        const defaultProj = {
          id: randomUUID(),
          name: '项目1',
          description: '默认项目',
          createdAt: new Date().toISOString(),
          visibility: 'all',
          visibleMembers: [],
        };
        writeJSON('projects.json', [defaultProj]);
        return [defaultProj];
      }
      return [];
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    if (filename === 'projects.json' && data.length === 0) {
      const defaultProj = {
        id: randomUUID(),
        name: '项目1',
        description: '默认项目',
        createdAt: new Date().toISOString(),
        visibility: 'all',
        visibleMembers: [],
      };
      data.push(defaultProj);
      writeJSON('projects.json', data);
    }
    return data;
  } catch (e) {
    console.error(`Read error ${filename}:`, e);
    return [];
  }
}

function writeJSON(filename, data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(DATA_DIR, filename),
      JSON.stringify(data, null, 2),
      'utf-8',
    );
  } catch (e) {
    console.warn(`Write ignored/failed for ${filename} (Normal on Vercel):`, e);
  }
}

// ══════════════════════════════════════════════════
//  Users API
// ══════════════════════════════════════════════════

app.get('/api/users', async (req, res) => {
  try {
    if (USE_DB) {
      const users = await db.getUsers();
      return res.json(users);
    }
    const users = readJSON('users.json');
    res.json(users.map(({ password, ...rest }) => rest));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password)
      return res.status(400).json({ error: '姓名和密码不能为空' });
    if (USE_DB) {
      const existing = await db.findUserByName(name);
      if (existing) return res.status(409).json({ error: '用户名已存在' });
      const user = await db.createUser(name, password);
      return res.status(201).json(user);
    }
    const users = readJSON('users.json');
    if (users.find((u) => u.name === name))
      return res.status(409).json({ error: '用户名已存在' });
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth', async (req, res) => {
  try {
    const { name, password } = req.body;
    if (USE_DB) {
      const user = await db.findUserByNameAndPassword(name, password);
      if (!user) return res.status(401).json({ error: '用户名或密码错误' });
      return res.json(user);
    }
    const users = readJSON('users.json');
    const user = users.find((u) => u.name === name && u.password === password);
    if (!user) return res.status(401).json({ error: '用户名或密码错误' });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════
//  Projects API
// ══════════════════════════════════════════════════

app.get('/api/projects', async (req, res) => {
  try {
    if (USE_DB) {
      const projects = await db.getProjects();
      return res.json(projects);
    }
    res.json(readJSON('projects.json'));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;
    if (!name) return res.status(400).json({ error: '项目名称不能为空' });
    if (USE_DB) {
      const project = await db.createProject({ name, description, createdBy });
      return res.status(201).json(project);
    }
    const project = {
      id: randomUUID(),
      name,
      description: description || '',
      createdBy,
      ownerId: createdBy,
      visibility: 'all',
      visibleMembers: [],
      createdAt: new Date().toISOString(),
    };
    const projects = readJSON('projects.json');
    projects.push(project);
    writeJSON('projects.json', projects);
    res.status(201).json(project);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (USE_DB) {
      const updated = await db.updateProject(id, updates);
      if (!updated) return res.status(404).json({ error: '未找到该项目' });
      return res.json(updated);
    }
    const projects = readJSON('projects.json');
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return res.status(404).json({ error: '未找到该项目' });
    projects[index] = {
      ...projects[index],
      ...updates,
      id: projects[index].id,
      createdAt: projects[index].createdAt,
    };
    writeJSON('projects.json', projects);
    res.json(projects[index]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (USE_DB) {
      const deleted = await db.deleteProject(id);
      if (!deleted) return res.status(404).json({ error: '未找到该项目' });
      return res.status(204).send();
    }
    let projects = readJSON('projects.json');
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return res.status(404).json({ error: '未找到该项目' });
    projects.splice(index, 1);
    writeJSON('projects.json', projects);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════
//  Todos API
// ══════════════════════════════════════════════════

app.get('/api/todos', async (req, res) => {
  try {
    if (USE_DB) {
      const todos = await db.getTodos();
      return res.json(todos);
    }
    const todos = readJSON('todos.json');
    const comments = readJSON('comments.json');
    const todosWithCount = todos.map((t) => ({
      ...t,
      commentCount: comments.filter((c) => c.todoId === t.id).length,
    }));
    res.json(todosWithCount);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      createdBy,
      projectId,
      visibility,
      visibleMembers,
    } = req.body;
    if (!title) return res.status(400).json({ error: '标题不能为空' });
    if (!projectId) return res.status(400).json({ error: '项目ID不能为空' });
    if (USE_DB) {
      const todo = await db.createTodo({
        title,
        description,
        category,
        createdBy,
        projectId,
        visibility,
        visibleMembers,
      });
      return res.status(201).json(todo);
    }
    const now = new Date().toISOString();
    const todo = {
      id: randomUUID(),
      title,
      description: description || '',
      status: 'pending',
      category: category || '未分类',
      visibility: visibility || 'all',
      visibleMembers: visibleMembers || [],
      createdBy: createdBy || 'unknown',
      projectId,
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    const todos = readJSON('todos.json');
    todos.push(todo);
    writeJSON('todos.json', todos);
    res.status(201).json(todo);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (USE_DB) {
      const updated = await db.updateTodo(id, updates);
      if (!updated) return res.status(404).json({ error: '未找到该 Todo' });
      return res.json(updated);
    }
    const todos = readJSON('todos.json');
    const comments = readJSON('comments.json');
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) return res.status(404).json({ error: '未找到该 Todo' });
    todos[index] = {
      ...todos[index],
      ...updates,
      id: todos[index].id,
      createdAt: todos[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    writeJSON('todos.json', todos);
    const todoWithCount = {
      ...todos[index],
      commentCount: comments.filter((c) => c.todoId === id).length,
    };
    res.json(todoWithCount);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (USE_DB) {
      const deleted = await db.deleteTodo(id);
      if (!deleted) return res.status(404).json({ error: '未找到该 Todo' });
      return res.status(204).send();
    }
    let todos = readJSON('todos.json');
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) return res.status(404).json({ error: '未找到该 Todo' });
    todos.splice(index, 1);
    writeJSON('todos.json', todos);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════════
//  Comments API
// ══════════════════════════════════════════════════

app.get('/api/todos/:todoId/comments', async (req, res) => {
  try {
    const { todoId } = req.params;
    if (USE_DB) {
      const comments = await db.getComments(todoId);
      return res.json(comments);
    }
    const all = readJSON('comments.json');
    res.json(all.filter((c) => c.todoId === todoId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/todos/:todoId/comments', async (req, res) => {
  try {
    const { todoId } = req.params;
    const { content, createdBy } = req.body;
    if (!content) return res.status(400).json({ error: '评论内容不能为空' });
    if (USE_DB) {
      const comment = await db.createComment({ content, todoId, createdBy });
      return res.status(201).json(comment);
    }
    const comment = {
      id: randomUUID(),
      content,
      todoId,
      createdBy,
      createdAt: new Date().toISOString(),
    };
    const comments = readJSON('comments.json');
    comments.push(comment);
    writeJSON('comments.json', comments);
    res.status(201).json(comment);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (USE_DB) {
      const deleted = await db.deleteComment(id);
      if (!deleted) return res.status(404).json({ error: '未找到该评论' });
      return res.status(204).send();
    }
    let comments = readJSON('comments.json');
    const index = comments.findIndex((c) => c.id === id);
    if (index === -1) return res.status(404).json({ error: '未找到该评论' });
    comments.splice(index, 1);
    writeJSON('comments.json', comments);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 本地开发监听 ──────────────────────────────────
if (!process.env.VERCEL) {
  app.listen(PORT, () =>
    console.log(`📦 API server: http://localhost:${PORT}`),
  );
}

export default app;
