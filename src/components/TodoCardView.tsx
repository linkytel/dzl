import { useState } from 'react';
import {
  Card,
  Tag,
  Space,
  Empty,
  Spin,
  Typography,
  Badge,
  Collapse,
} from 'antd';
import {
  CalendarOutlined,
  ScheduleOutlined,
  CheckOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useTodos } from '../contexts/TodoContext';
import { useAuth } from '../contexts/AuthContext';
import type { Todo } from '../types';
import {
  getMonthKey,
  getDayKey,
  formatMonthLabel,
  formatDayLabel,
  formatDateTime,
} from '../utils/date';

const { Text } = Typography;

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'warning' },
  'in-progress': { label: '进行中', color: 'processing' },
  done: { label: '已完成', color: 'success' },
};

interface GroupedTodos {
  key: string;
  label: string;
  todos: Todo[];
}

function TodoCardItem({
  todo,
  cycleStatus,
}: {
  todo: Todo;
  cycleStatus: (todo: Todo) => void;
}) {
  const { users } = useAuth();
  const [showDesc, setShowDesc] = useState(false);
  const creator = users.find((u) => u.id === todo.createdBy);
  const statusInfo = STATUS_MAP[todo.status];
  const isDescEmpty = !todo.description || todo.description === '<p><br></p>';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        opacity: todo.status === 'done' ? 0.6 : 1,
      }}
    >
      <div
        style={{
          marginTop: 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: `2px solid ${todo.status === 'done' ? '#52c41a' : todo.status === 'in-progress' ? '#1677ff' : '#424a53'}`,
          background: todo.status === 'done' ? '#52c41a' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          cursor: 'pointer',
        }}
        onClick={() => cycleStatus(todo)}
      >
        {todo.status === 'done' && (
          <CheckOutlined style={{ fontSize: 8, color: '#fff' }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <Text
            onClick={() => setShowDesc(!showDesc)}
            style={{
              cursor: 'pointer',
              fontSize: 13,
              textDecoration: todo.status === 'done' ? 'line-through' : 'none',
              color: todo.status === 'done' ? '#6e7681' : '#e6edf3',
            }}
          >
            {todo.title}
          </Text>
          <Tag
            color={statusInfo.color}
            style={{
              margin: 0,
              fontSize: 10,
              lineHeight: '16px',
              padding: '0 4px',
            }}
          >
            {statusInfo.label}
          </Tag>
          {todo.category && todo.category !== '未分类' && (
            <Tag
              style={{
                margin: 0,
                fontSize: 10,
                lineHeight: '16px',
                padding: '0 4px',
                background: 'rgba(139, 92, 246, 0.12)',
                borderColor: 'rgba(139, 92, 246, 0.25)',
                color: '#a78bfa',
              }}
            >
              {todo.category}
            </Tag>
          )}
        </div>

        {showDesc && !isDescEmpty && (
          <div
            style={{
              fontSize: 12,
              color: '#6e7681',
              maxHeight: 40,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              marginTop: 4,
            }}
            dangerouslySetInnerHTML={{ __html: todo.description }}
          />
        )}

        <div style={{ marginTop: 4 }}>
          <Space size={12}>
            <Text type="secondary" style={{ fontSize: 10 }}>
              <UserOutlined style={{ marginRight: 3 }} />
              {creator?.name || '未知'}
            </Text>
            <Text type="secondary" style={{ fontSize: 10 }}>
              {formatDateTime(todo.createdAt)}
            </Text>
          </Space>
        </div>
      </div>
    </div>
  );
}

function GroupCard({
  group,
  type,
}: {
  group: GroupedTodos;
  type: 'month' | 'day';
}) {
  const { updateTodo } = useTodos();

  const pendingCount = group.todos.filter((t) => t.status === 'pending').length;
  const progressCount = group.todos.filter(
    (t) => t.status === 'in-progress',
  ).length;
  const doneCount = group.todos.filter((t) => t.status === 'done').length;

  const cycleStatus = async (todo: Todo) => {
    const next: Record<string, Todo['status']> = {
      pending: 'in-progress',
      'in-progress': 'done',
      done: 'pending',
    };
    await updateTodo(todo.id, { status: next[todo.status] });
  };

  const headerContent = (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background:
            type === 'month'
              ? 'linear-gradient(135deg, rgba(22, 119, 255, 0.15), rgba(114, 46, 209, 0.15))'
              : 'linear-gradient(135deg, rgba(82, 196, 26, 0.15), rgba(34, 211, 238, 0.15))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {type === 'month' ? (
          <CalendarOutlined style={{ fontSize: 18, color: '#1677ff' }} />
        ) : (
          <ScheduleOutlined style={{ fontSize: 18, color: '#52c41a' }} />
        )}
      </div>
      <div style={{ flex: 1 }}>
        <Text strong style={{ fontSize: 15 }}>
          {group.label}
        </Text>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            共 {group.todos.length} 条记录
          </Text>
        </div>
      </div>
      <Space size={8}>
        {pendingCount > 0 && (
          <Badge count={pendingCount} color="#d97706" size="small" />
        )}
        {progressCount > 0 && (
          <Badge count={progressCount} color="#1677ff" size="small" />
        )}
        {doneCount > 0 && (
          <Badge count={doneCount} color="#52c41a" size="small" />
        )}
      </Space>
    </div>
  );

  const items = [
    {
      key: group.key,
      label: headerContent,
      children: (
        <Space direction="vertical" size={6} style={{ width: '100%' }}>
          {group.todos.map((todo) => (
            <TodoCardItem key={todo.id} todo={todo} cycleStatus={cycleStatus} />
          ))}
        </Space>
      ),
    },
  ];

  return (
    <Card
      className="group-card"
      bordered={false}
      style={{
        background: 'rgba(22, 27, 34, 0.5)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
      styles={{ body: { padding: 0 } }}
    >
      <Collapse
        ghost
        items={items}
        defaultActiveKey={[]}
        style={{ background: 'transparent' }}
      />
    </Card>
  );
}

export function TodoCardView({ type }: { type: 'month' | 'day' }) {
  const { filteredTodos, loading } = useTodos();

  if (loading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (filteredTodos.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={<Text type="secondary">还没有任务</Text>}
        style={{ padding: '60px 0' }}
      />
    );
  }

  const grouped = new Map<string, Todo[]>();
  filteredTodos.forEach((todo) => {
    const key =
      type === 'month'
        ? getMonthKey(todo.createdAt)
        : getDayKey(todo.createdAt);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(todo);
  });

  const groups: GroupedTodos[] = Array.from(grouped.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, todos]) => ({
      key,
      label: type === 'month' ? formatMonthLabel(key) : formatDayLabel(key),
      todos,
    }));

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {type === 'month' ? '按月' : '按日'}分组 ·{' '}
          <Text style={{ color: '#e6edf3', fontSize: 13 }}>
            {groups.length}
          </Text>{' '}
          {type === 'month' ? '个月' : '天'}
        </Text>
      </div>
      <div className="card-grid">
        {groups.map((group) => (
          <GroupCard key={group.key} group={group} type={type} />
        ))}
      </div>
    </div>
  );
}
