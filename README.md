# WiGS - 我的电商创业之路 📦

> **W**ork **i**n pro**G**re**S**s — 记录电商创业之路的 Todo 工具

## 项目概述

WiGS 是一个轻量级的 Todo 管理工具，专为记录电商创业过程中的各项任务而设计。支持多用户协作、多视图切换，数据本地化存储。

## 技术栈

- **前端框架**: React 19 + Vite
- **样式方案**: TailwindCSS v4
- **语言**: TypeScript
- **数据存储**: 本地 JSON 文件（通过 Vite dev server 代理实现读写）
- **状态管理**: React Context + useReducer

## 功能特性

### 用户系统

- 首次进入提示创建用户（姓名 + 密码）
- 登录验证
- 支持多用户切换
- 切换用户不影响数据查看，仅影响新建 Todo 的「添加人」字段

### Todo 管理

- **字段**: 标题、描述、状态、添加人、创建时间、更新时间
- 添加 Todo 时自动记录当前时间
- 支持编辑、删除、状态变更

### 多视图模式

- **列表模式**（默认）: 扁平列表展示所有 Todo
- **按月卡片模式**: 以月为维度聚合，卡片显示当月记录数
- **按日卡片模式**: 以日为维度聚合，卡片显示当日记录数

### 数据存储

- 结构化 JSON 文件存储
- 保持良好的可扩展性，便于后续迁移至数据库

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 项目结构

```
wigs/
├── public/                  # 静态资源
├── src/
│   ├── components/          # 通用组件
│   │   ├── Layout.tsx       # 页面布局
│   │   ├── Header.tsx       # 顶部导航栏
│   │   ├── TodoForm.tsx     # 新建/编辑 Todo 表单
│   │   ├── TodoList.tsx     # 列表视图
│   │   ├── TodoCard.tsx     # 卡片视图
│   │   ├── ViewSwitcher.tsx # 视图切换器
│   │   ├── LoginForm.tsx    # 登录表单
│   │   └── UserSwitcher.tsx # 用户切换器
│   ├── contexts/
│   │   ├── AuthContext.tsx   # 用户认证上下文
│   │   └── TodoContext.tsx   # Todo 数据上下文
│   ├── types/
│   │   └── index.ts         # TypeScript 类型定义
│   ├── utils/
│   │   ├── storage.ts       # 数据存储工具
│   │   └── date.ts          # 日期格式化工具
│   ├── App.tsx              # 应用入口
│   ├── main.tsx             # 渲染入口
│   └── index.css            # 全局样式
├── data/                    # 数据存储目录
│   ├── todos.json           # Todo 数据
│   └── users.json           # 用户数据
├── server/
│   └── api.js               # 简易文件读写 API（Express）
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 数据结构

### User

```typescript
interface User {
  id: string; // UUID
  name: string; // 用户名
  password: string; // 密码（本地存储，简单加密）
  createdAt: string; // 创建时间 ISO 8601
}
```

### Todo

```typescript
interface Todo {
  id: string; // UUID
  title: string; // 标题
  description: string; // 描述
  status: 'pending' | 'in-progress' | 'done'; // 状态
  createdBy: string; // 添加人（用户 ID）
  createdAt: string; // 创建时间 ISO 8601
  updatedAt: string; // 更新时间 ISO 8601
}
```

## API 设计

| Method | Path           | Description   |
| ------ | -------------- | ------------- |
| GET    | /api/todos     | 获取所有 Todo |
| POST   | /api/todos     | 创建 Todo     |
| PUT    | /api/todos/:id | 更新 Todo     |
| DELETE | /api/todos/:id | 删除 Todo     |
| GET    | /api/users     | 获取所有用户  |
| POST   | /api/users     | 创建用户      |
| POST   | /api/auth      | 用户登录验证  |

## License

MIT
