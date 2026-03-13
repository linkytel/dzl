import { neon } from '@neondatabase/serverless';

let sql;

function getSQL() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

// ── 初始化表结构 ──────────────────────────────────

export async function initDB() {
  const sql = getSQL();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      owner_id UUID REFERENCES users(id),
      created_by UUID REFERENCES users(id),
      visibility VARCHAR(20) DEFAULT 'all',
      visible_members UUID[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS todos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(500) NOT NULL,
      description TEXT DEFAULT '',
      status VARCHAR(20) DEFAULT 'pending',
      category VARCHAR(100) DEFAULT '未分类',
      visibility VARCHAR(20) DEFAULT 'all',
      visible_members UUID[] DEFAULT '{}',
      created_by UUID REFERENCES users(id),
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content TEXT NOT NULL,
      todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // ── Migration: add new columns to existing tables ───
  const addColumnExplicitly = async (table, col, alterQuery) => {
    try {
      const rows = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ${table} AND column_name = ${col}
      `;
      if (rows.length === 0) {
        await alterQuery();
      }
    } catch (e) {
      console.error(`Failed to add column ${col} to ${table}:`, e);
    }
  };

  await addColumnExplicitly(
    'projects',
    'owner_id',
    () =>
      sql`ALTER TABLE projects ADD COLUMN owner_id UUID REFERENCES users(id)`,
  );
  await addColumnExplicitly(
    'projects',
    'visibility',
    () =>
      sql`ALTER TABLE projects ADD COLUMN visibility VARCHAR(20) DEFAULT 'all'`,
  );
  await addColumnExplicitly(
    'projects',
    'visible_members',
    () =>
      sql`ALTER TABLE projects ADD COLUMN visible_members UUID[] DEFAULT '{}'`,
  );
  await addColumnExplicitly(
    'todos',
    'visibility',
    () =>
      sql`ALTER TABLE todos ADD COLUMN visibility VARCHAR(20) DEFAULT 'all'`,
  );
  await addColumnExplicitly(
    'todos',
    'visible_members',
    () => sql`ALTER TABLE todos ADD COLUMN visible_members UUID[] DEFAULT '{}'`,
  );

  // Ensure default project
  const projects = await sql`SELECT id FROM projects LIMIT 1`;
  if (projects.length === 0) {
    await sql`INSERT INTO projects (name, description) VALUES ('项目1', '默认项目')`;
  }

  // Assign existing todos to default project if missing
  try {
    const defaultProj =
      await sql`SELECT id FROM projects ORDER BY created_at LIMIT 1`;
    if (defaultProj.length > 0) {
      await sql`UPDATE todos SET project_id = ${defaultProj[0].id} WHERE project_id IS NULL`;
    }
  } catch (e) {
    console.error('Migration error (default project):', e);
  }

  // Migration: set owner_id of existing projects to user "leon"
  try {
    const leon = await sql`SELECT id FROM users WHERE name = 'leon' LIMIT 1`;
    if (leon.length > 0) {
      await sql`UPDATE projects SET owner_id = ${leon[0].id} WHERE owner_id IS NULL`;
    }
  } catch (e) {
    console.error('Migration error (leon owner):', e);
  }

  // Migration: set default visibility for old records
  try {
    await sql`UPDATE projects SET visibility = 'all' WHERE visibility IS NULL`;
    await sql`UPDATE todos SET visibility = 'all' WHERE visibility IS NULL`;
  } catch (e) {
    console.error('Migration error (visibility):', e);
  }

  console.log('✅ Database tables initialized');
}

// ── Projects ───────────────────────────────────────

function mapProject(r) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    ownerId: r.owner_id,
    createdBy: r.created_by,
    visibility: r.visibility || 'all',
    visibleMembers: r.visible_members || [],
    createdAt: r.created_at,
  };
}

export async function getProjects() {
  const sql = getSQL();
  const rows =
    await sql`SELECT id, name, description, owner_id, created_by, visibility, visible_members, created_at FROM projects ORDER BY created_at ASC`;
  return rows.map(mapProject);
}

export async function createProject({ name, description, createdBy }) {
  const sql = getSQL();
  const rows = await sql`
    INSERT INTO projects (name, description, created_by, owner_id, visibility, visible_members)
    VALUES (${name}, ${description || ''}, ${createdBy}, ${createdBy}, 'all', '{}')
    RETURNING id, name, description, owner_id, created_by, visibility, visible_members, created_at
  `;
  return mapProject(rows[0]);
}

export async function updateProject(id, updates) {
  const sql = getSQL();
  const current = await sql`SELECT * FROM projects WHERE id = ${id}`;
  if (current.length === 0) return null;

  const proj = current[0];
  const newName = updates.name ?? proj.name;
  const newDesc = updates.description ?? proj.description;
  const newVisibility = updates.visibility ?? proj.visibility;
  const newVisibleMembers =
    updates.visibleMembers ?? proj.visible_members ?? [];

  const rows = await sql`
    UPDATE projects
    SET name = ${newName},
        description = ${newDesc},
        visibility = ${newVisibility},
        visible_members = ${newVisibleMembers},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, name, description, owner_id, created_by, visibility, visible_members, created_at
  `;
  if (rows.length === 0) return null;
  return mapProject(rows[0]);
}

export async function deleteProject(id) {
  const sql = getSQL();
  const result = await sql`DELETE FROM projects WHERE id = ${id} RETURNING id`;
  return result.length > 0;
}

// ── Users ──────────────────────────────────────────

export async function getUsers() {
  const sql = getSQL();
  const rows =
    await sql`SELECT id, name, created_at FROM users ORDER BY created_at`;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
  }));
}

export async function createUser(name, password) {
  const sql = getSQL();
  const rows = await sql`
    INSERT INTO users (name, password)
    VALUES (${name}, ${password})
    RETURNING id, name, created_at
  `;
  const r = rows[0];
  return { id: r.id, name: r.name, createdAt: r.created_at };
}

export async function findUserByNameAndPassword(name, password) {
  const sql = getSQL();
  const rows = await sql`
    SELECT id, name, created_at FROM users
    WHERE name = ${name} AND password = ${password}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const r = rows[0];
  return { id: r.id, name: r.name, createdAt: r.created_at };
}

export async function findUserByName(name) {
  const sql = getSQL();
  const rows = await sql`SELECT id FROM users WHERE name = ${name} LIMIT 1`;
  return rows.length > 0 ? rows[0] : null;
}

// ── Todos ──────────────────────────────────────────

function mapTodo(r) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status,
    category: r.category,
    visibility: r.visibility || 'all',
    visibleMembers: r.visible_members || [],
    createdBy: r.created_by,
    projectId: r.project_id,
    commentCount: parseInt(r.comment_count || 0),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getTodos() {
  const sql = getSQL();
  const rows = await sql`
    SELECT 
      t.id, t.title, t.description, t.status, t.category, t.visibility, t.visible_members, t.created_by, t.project_id, t.created_at, t.updated_at,
      (SELECT COUNT(*) FROM comments c WHERE c.todo_id = t.id) as comment_count
    FROM todos t
    ORDER BY t.created_at DESC
  `;
  return rows.map(mapTodo);
}

export async function createTodo({
  title,
  description,
  category,
  createdBy,
  projectId,
  visibility,
  visibleMembers,
}) {
  const sql = getSQL();
  const rows = await sql`
    INSERT INTO todos (title, description, category, created_by, project_id, visibility, visible_members)
    VALUES (${title}, ${description || ''}, ${category || '未分类'}, ${createdBy}, ${projectId}, ${visibility || 'all'}, ${visibleMembers || []})
    RETURNING id, title, description, status, category, visibility, visible_members, created_by, project_id, created_at, updated_at
  `;
  return mapTodo(rows[0]);
}

export async function updateTodo(id, updates) {
  const sql = getSQL();
  const current = await sql`SELECT * FROM todos WHERE id = ${id}`;
  if (current.length === 0) return null;

  const todo = current[0];
  const newTitle = updates.title ?? todo.title;
  const newDesc = updates.description ?? todo.description;
  const newStatus = updates.status ?? todo.status;
  const newCategory = updates.category ?? todo.category;
  const newVisibility = updates.visibility ?? todo.visibility;
  const newVisibleMembers =
    updates.visibleMembers ?? todo.visible_members ?? [];

  const rows = await sql`
    UPDATE todos
    SET title = ${newTitle},
        description = ${newDesc},
        status = ${newStatus},
        category = ${newCategory},
        visibility = ${newVisibility},
        visible_members = ${newVisibleMembers},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, title, description, status, category, visibility, visible_members, created_by, project_id, created_at, updated_at
  `;
  if (rows.length === 0) return null;
  return mapTodo(rows[0]);
}

export async function deleteTodo(id) {
  const sql = getSQL();
  const result = await sql`DELETE FROM todos WHERE id = ${id} RETURNING id`;
  return result.length > 0;
}

// ── Comments ──────────────────────────────────────

function mapComment(r) {
  return {
    id: r.id,
    content: r.content,
    todoId: r.todo_id,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

export async function getComments(todoId) {
  const sql = getSQL();
  const rows = await sql`
    SELECT id, content, todo_id, created_by, created_at
    FROM comments
    WHERE todo_id = ${todoId}
    ORDER BY created_at ASC
  `;
  return rows.map(mapComment);
}

export async function createComment({ content, todoId, createdBy }) {
  const sql = getSQL();
  const rows = await sql`
    INSERT INTO comments (content, todo_id, created_by)
    VALUES (${content}, ${todoId}, ${createdBy})
    RETURNING id, content, todo_id, created_by, created_at
  `;
  return mapComment(rows[0]);
}

export async function deleteComment(id) {
  const sql = getSQL();
  const result = await sql`DELETE FROM comments WHERE id = ${id} RETURNING id`;
  return result.length > 0;
}
