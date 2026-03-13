import { Layout, Tabs, Badge, Space, Typography, Statistic, Card } from 'antd';
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { AppHeader } from './Header';
import { TodoForm } from './TodoForm';
import { TodoList } from './TodoList';
import { TodoCardView } from './TodoCardView';
import { useTodos } from '../contexts/TodoContext';

const { Content } = Layout;
const { Text } = Typography;

export function MainLayout() {
  const {
    viewMode,
    todos,
    filteredTodos,
    activeCategory,
    setActiveCategory,
    categories,
  } = useTodos();

  const pendingCount = filteredTodos.filter(
    (t) => t.status === 'pending',
  ).length;
  const progressCount = filteredTodos.filter(
    (t) => t.status === 'in-progress',
  ).length;
  const doneCount = filteredTodos.filter((t) => t.status === 'done').length;

  // Build category tabs
  const categoryTabs = [
    {
      key: '全部',
      label: (
        <Space size={4}>
          <AppstoreOutlined />
          全部
          <Badge
            count={todos.length}
            size="small"
            style={{ backgroundColor: '#6e7681' }}
          />
        </Space>
      ),
    },
    ...categories.map((cat) => ({
      key: cat,
      label: (
        <Space size={4}>
          {cat}
          <Badge
            count={todos.filter((t) => t.category === cat).length}
            size="small"
            style={{ backgroundColor: 'rgba(139, 92, 246, 0.6)' }}
          />
        </Space>
      ),
    })),
  ];

  return (
    <Layout className="app-layout">
      <AppHeader />
      <Content className="app-content">
        {/* Stats Row */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          <Card
            size="small"
            bordered={false}
            style={{
              flex: 1,
              minWidth: 120,
              background: 'rgba(22, 27, 34, 0.6)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <Statistic
              title={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  总任务
                </Text>
              }
              value={filteredTodos.length}
              valueStyle={{ fontSize: 22, fontWeight: 700, color: '#e6edf3' }}
            />
          </Card>
          <Card
            size="small"
            bordered={false}
            style={{
              flex: 1,
              minWidth: 120,
              background: 'rgba(217, 119, 6, 0.06)',
              border: '1px solid rgba(217, 119, 6, 0.12)',
            }}
          >
            <Statistic
              title={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <ClockCircleOutlined /> 待处理
                </Text>
              }
              value={pendingCount}
              valueStyle={{ fontSize: 22, fontWeight: 700, color: '#d97706' }}
            />
          </Card>
          <Card
            size="small"
            bordered={false}
            style={{
              flex: 1,
              minWidth: 120,
              background: 'rgba(22, 119, 255, 0.06)',
              border: '1px solid rgba(22, 119, 255, 0.12)',
            }}
          >
            <Statistic
              title={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <SyncOutlined /> 进行中
                </Text>
              }
              value={progressCount}
              valueStyle={{ fontSize: 22, fontWeight: 700, color: '#1677ff' }}
            />
          </Card>
          <Card
            size="small"
            bordered={false}
            style={{
              flex: 1,
              minWidth: 120,
              background: 'rgba(82, 196, 26, 0.06)',
              border: '1px solid rgba(82, 196, 26, 0.12)',
            }}
          >
            <Statistic
              title={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <CheckCircleOutlined /> 已完成
                </Text>
              }
              value={doneCount}
              valueStyle={{ fontSize: 22, fontWeight: 700, color: '#52c41a' }}
            />
          </Card>
        </div>

        {/* Todo Form */}
        <TodoForm />

        {/* Category Tabs */}
        {categories.length > 0 && (
          <Tabs
            className="category-tabs"
            activeKey={activeCategory}
            onChange={setActiveCategory}
            items={categoryTabs}
            size="small"
            tabBarStyle={{
              marginBottom: 16,
            }}
          />
        )}

        {/* Content */}
        {viewMode === 'list' && <TodoList />}
        {viewMode === 'month' && <TodoCardView type="month" />}
        {viewMode === 'day' && <TodoCardView type="day" />}
      </Content>
    </Layout>
  );
}
