import { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  AutoComplete,
  Typography,
  Select,
} from 'antd';
import {
  PlusOutlined,
  LockOutlined,
  GlobalOutlined,
  TeamOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import ReactQuill from 'react-quill-new';
import { useAuth } from '../contexts/AuthContext';
import { useTodos } from '../contexts/TodoContext';
import type { Visibility } from '../types';

const { Text } = Typography;

const VISIBILITY_OPTIONS = [
  {
    label: (
      <Space>
        <GlobalOutlined />
        所有人可见
      </Space>
    ),
    value: 'all',
  },
  {
    label: (
      <Space>
        <LockOutlined />
        仅自己可见
      </Space>
    ),
    value: 'self',
  },
  {
    label: (
      <Space>
        <TeamOutlined />
        指定成员可见
      </Space>
    ),
    value: 'members',
  },
  {
    label: (
      <Space>
        <EyeInvisibleOutlined />
        不可见
      </Space>
    ),
    value: 'none',
  },
];

export function TodoForm() {
  const { currentUser, users } = useAuth();
  const { addTodo, categories, currentProjectId } = useTodos();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('all');
  const [visibleMembers, setVisibleMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const categoryOptions = categories.map((c) => ({ value: c, label: c }));

  const handleSubmit = async () => {
    if (!title.trim() || !currentUser || !currentProjectId) return;
    setLoading(true);
    try {
      await addTodo(
        title.trim(),
        description,
        category.trim() || '未分类',
        currentUser.id,
        visibility,
        visibleMembers,
      );
      setTitle('');
      setDescription('');
      setCategory('');
      setVisibility('all');
      setVisibleMembers([]);
      setExpanded(false);
    } catch (err) {
      console.error('Failed to add todo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setExpanded(false);
    setTitle('');
    setDescription('');
    setCategory('');
    setVisibility('all');
    setVisibleMembers([]);
  };

  if (!expanded) {
    return (
      <Card
        className="todo-form-card"
        bordered={false}
        style={{
          background: 'rgba(22, 27, 34, 0.6)',
          border: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(true)}
      >
        <Space style={{ color: '#6e7681' }}>
          <PlusOutlined />
          <span>添加新记录...</span>
        </Space>
      </Card>
    );
  }

  return (
    <Card
      className="todo-form-card fade-in-up"
      bordered={false}
      style={{
        background: 'rgba(22, 27, 34, 0.8)',
        border: '1px solid rgba(22, 119, 255, 0.2)',
        boxShadow: '0 4px 24px rgba(22, 119, 255, 0.06)',
      }}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Input
          placeholder="标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          id="todo-title-input"
          size="large"
          autoFocus
          onPressEnter={handleSubmit}
          style={{ fontWeight: 500 }}
        />

        <div style={{ margin: '4px 0' }}>
          <ReactQuill
            theme="snow"
            value={description}
            onChange={setDescription}
            placeholder="支持富文本描述（可选）..."
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <AutoComplete
            style={{ flex: 1 }}
            options={categoryOptions}
            value={category}
            onChange={setCategory}
            placeholder="输入类型（如：运营、产品...）"
            filterOption={(input, option) =>
              (option?.label as string)
                ?.toLowerCase()
                .includes(input.toLowerCase())
            }
          />
          <Select
            value={visibility}
            onChange={setVisibility}
            options={VISIBILITY_OPTIONS}
            style={{ width: 150 }}
          />
        </div>

        {visibility === 'members' && (
          <Select
            mode="multiple"
            placeholder="选择可见成员"
            value={visibleMembers}
            onChange={setVisibleMembers}
            options={users.map((u) => ({ label: u.name, value: u.id }))}
            style={{ width: '100%' }}
          />
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 4,
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            添加人:{' '}
            <Text style={{ color: '#1677ff', fontSize: 12 }}>
              {currentUser?.name}
            </Text>
          </Text>
          <Space>
            <Button onClick={handleCancel}>取消</Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              disabled={!title.trim() || !currentProjectId}
              id="todo-submit"
            >
              添加
            </Button>
          </Space>
        </div>
      </Space>
    </Card>
  );
}
