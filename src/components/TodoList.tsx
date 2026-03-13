import { useState, useEffect } from 'react';
import {
  Card,
  Tag,
  Button,
  Space,
  Input,
  Tooltip,
  Popconfirm,
  Empty,
  Spin,
  Typography,
  AutoComplete,
  Select,
  List,
  Avatar,
  Badge,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SyncOutlined,
  MessageOutlined,
  GlobalOutlined,
  LockOutlined,
  TeamOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import ReactQuill from 'react-quill-new';
import { useTodos } from '../contexts/TodoContext';
import { useAuth } from '../contexts/AuthContext';
import type { Todo, Visibility, Comment } from '../types';
import { formatDateTime } from '../utils/date';

const { Text } = Typography;

const STATUS_MAP: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: { label: '待处理', color: 'warning', icon: <ClockCircleOutlined /> },
  'in-progress': {
    label: '进行中',
    color: 'processing',
    icon: <SyncOutlined spin />,
  },
  done: { label: '已完成', color: 'success', icon: <CheckOutlined /> },
};

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

function TodoItem({ todo }: { todo: Todo }) {
  const {
    updateTodo,
    deleteTodo,
    categories,
    getComments,
    addComment,
    deleteComment,
  } = useTodos();
  const { users, currentUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDesc, setEditDesc] = useState(todo.description);
  const [editCategory, setEditCategory] = useState(todo.category);
  const [editVisibility, setEditVisibility] = useState<Visibility>(
    todo.visibility || 'all',
  );
  const [editVisibleMembers, setEditVisibleMembers] = useState<string[]>(
    todo.visibleMembers || [],
  );

  const [showDesc, setShowDesc] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const creator = users.find((u) => u.id === todo.createdBy);
  const statusInfo = STATUS_MAP[todo.status];

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const data = await getComments(todo.id);
      setComments(data);
    } catch {
      //
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    const trimmed = commentText.replace(/<[^>]*>/g, '').trim();
    if (!trimmed || !currentUser) return;
    setSubmittingComment(true);
    try {
      const newComment = await addComment(todo.id, commentText, currentUser.id);
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      // Update local comment count for the badge
      todo.commentCount = (todo.commentCount || 0) + 1;
    } catch {
      //
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      //
    }
  };

  const cycleStatus = async () => {
    const next: Record<string, Todo['status']> = {
      pending: 'in-progress',
      'in-progress': 'done',
      done: 'pending',
    };
    await updateTodo(todo.id, { status: next[todo.status] });
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    await updateTodo(todo.id, {
      title: editTitle.trim(),
      description: editDesc,
      category: editCategory.trim() || '未分类',
      visibility: editVisibility,
      visibleMembers: editVisibleMembers,
    });
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditTitle(todo.title);
    setEditDesc(todo.description);
    setEditCategory(todo.category);
    setEditVisibility(todo.visibility || 'all');
    setEditVisibleMembers(todo.visibleMembers || []);
  };

  const isDescEmpty = !todo.description || todo.description === '<p><br></p>';

  if (editing) {
    return (
      <Card
        size="small"
        bordered={false}
        style={{
          background: 'rgba(22, 27, 34, 0.8)',
          border: '1px solid rgba(22, 119, 255, 0.2)',
        }}
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="标题"
            autoFocus
          />
          <div style={{ margin: '4px 0' }}>
            <ReactQuill theme="snow" value={editDesc} onChange={setEditDesc} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <AutoComplete
              style={{ flex: 1 }}
              options={categories.map((c) => ({ value: c, label: c }))}
              value={editCategory}
              onChange={setEditCategory}
              placeholder="类型"
            />
            <Select
              value={editVisibility}
              onChange={setEditVisibility}
              options={VISIBILITY_OPTIONS}
              style={{ width: 140 }}
            />
          </div>

          {editVisibility === 'members' && (
            <Select
              mode="multiple"
              placeholder="选择可见成员"
              value={editVisibleMembers}
              onChange={setEditVisibleMembers}
              options={users.map((u) => ({ label: u.name, value: u.id }))}
              style={{ width: '100%' }}
            />
          )}

          <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Button
              size="small"
              icon={<CloseOutlined />}
              onClick={handleCancelEdit}
            >
              取消
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleSave}
            >
              保存
            </Button>
          </Space>
        </Space>
      </Card>
    );
  }

  return (
    <Card
      size="small"
      bordered={false}
      hoverable
      style={{
        background: 'rgba(22, 27, 34, 0.5)',
        border: '1px solid rgba(255,255,255,0.04)',
        opacity: todo.status === 'done' ? 0.65 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Tooltip title="点击切换状态">
          <Button
            type="text"
            size="small"
            onClick={cycleStatus}
            style={{
              marginTop: 2,
              width: 22,
              height: 22,
              minWidth: 22,
              padding: 0,
              borderRadius: '50%',
              border:
                todo.status === 'done'
                  ? '2px solid #52c41a'
                  : todo.status === 'in-progress'
                    ? '2px solid #1677ff'
                    : '2px solid #424a53',
              background: todo.status === 'done' ? '#52c41a' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {todo.status === 'done' && (
              <CheckOutlined style={{ fontSize: 10, color: '#fff' }} />
            )}
            {todo.status === 'in-progress' && (
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#1677ff',
                }}
              />
            )}
          </Button>
        </Tooltip>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 4,
            }}
          >
            <Text
              onClick={() => setShowDesc(!showDesc)}
              style={{
                cursor: 'pointer',
                fontWeight: 500,
                textDecoration:
                  todo.status === 'done' ? 'line-through' : 'none',
                color: todo.status === 'done' ? '#6e7681' : '#e6edf3',
              }}
            >
              {todo.title}
            </Text>
            <Tag color={statusInfo.color} style={{ margin: 0, fontSize: 11 }}>
              {statusInfo.icon} {statusInfo.label}
            </Tag>
            {todo.category && todo.category !== '未分类' && (
              <Tag
                style={{
                  margin: 0,
                  fontSize: 11,
                  background: 'rgba(139, 92, 246, 0.12)',
                  borderColor: 'rgba(139, 92, 246, 0.25)',
                  color: '#a78bfa',
                }}
              >
                {todo.category}
              </Tag>
            )}
            {todo.visibility !== 'all' && (
              <Tooltip
                title={
                  VISIBILITY_OPTIONS.find((o) => o.value === todo.visibility)
                    ?.label
                }
              >
                <LockOutlined style={{ color: '#8b949e', fontSize: 12 }} />
              </Tooltip>
            )}
          </div>

          {showDesc && !isDescEmpty && (
            <div
              style={{
                marginBottom: 6,
                fontSize: 13,
                color: '#8b949e',
                lineHeight: 1.5,
              }}
              dangerouslySetInnerHTML={{ __html: todo.description }}
            />
          )}

          <Space size={16} style={{ flexWrap: 'wrap' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              <UserOutlined style={{ marginRight: 4 }} />
              {creator?.name || '未知'}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {formatDateTime(todo.createdAt)}
            </Text>
          </Space>

          {/* Comments Section */}
          {showComments && (
            <div
              style={{
                marginTop: 16,
                background: 'rgba(0,0,0,0.15)',
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text
                strong
                style={{ fontSize: 13, marginBottom: 8, display: 'block' }}
              >
                评论
              </Text>

              {loadingComments ? (
                <Spin size="small" />
              ) : (
                <List
                  dataSource={comments}
                  renderItem={(item) => {
                    const commentCreator = users.find(
                      (u) => u.id === item.createdBy,
                    );
                    return (
                      <div
                        style={{ display: 'flex', gap: 8, marginBottom: 12 }}
                      >
                        <Avatar size="small" style={{ background: '#1677ff' }}>
                          {commentCreator?.name?.charAt(0)}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Text style={{ fontSize: 12, color: '#e6edf3' }}>
                              {commentCreator?.name}
                            </Text>
                            <Space>
                              <Text type="secondary" style={{ fontSize: 10 }}>
                                {formatDateTime(item.createdAt)}
                              </Text>
                              {(item.createdBy === currentUser?.id ||
                                todo.createdBy === currentUser?.id) && (
                                <Popconfirm
                                  title="删除评论？"
                                  onConfirm={() => handleDeleteComment(item.id)}
                                >
                                  <Button
                                    type="text"
                                    danger
                                    size="small"
                                    style={{
                                      padding: 0,
                                      height: 'auto',
                                      fontSize: 11,
                                    }}
                                  >
                                    删除
                                  </Button>
                                </Popconfirm>
                              )}
                            </Space>
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: '#8b949e',
                              marginTop: 2,
                            }}
                            dangerouslySetInnerHTML={{ __html: item.content }}
                          />
                        </div>
                      </div>
                    );
                  }}
                  locale={{
                    emptyText: (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        暂无评论
                      </Text>
                    ),
                  }}
                />
              )}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <div
                  style={{
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <ReactQuill
                    theme="snow"
                    value={commentText}
                    onChange={setCommentText}
                    placeholder="写下你的评论..."
                    modules={{
                      toolbar: [
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ color: [] }, { background: [] }],
                        ['link', 'image'],
                        ['clean'],
                      ],
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="primary"
                    size="small"
                    onClick={handlePostComment}
                    loading={submittingComment}
                  >
                    发送
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <Space size={0}>
          <Tooltip title="评论">
            <Button
              type="text"
              size="small"
              icon={
                <Badge count={todo.commentCount} size="small" offset={[2, -2]}>
                  <MessageOutlined />
                </Badge>
              }
              onClick={() => setShowComments(!showComments)}
            />
          </Tooltip>
          {todo.createdBy === currentUser?.id && (
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => setEditing(true)}
              />
            </Tooltip>
          )}
          {todo.createdBy === currentUser?.id && (
            <Popconfirm
              title="确定要删除吗？"
              onConfirm={() => deleteTodo(todo.id)}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="删除">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      </div>
    </Card>
  );
}

export function TodoList() {
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
        description={
          <Text type="secondary">还没有任务，记录你的灵光一现吧！</Text>
        }
        style={{ padding: '60px 0' }}
      />
    );
  }

  return (
    <Space
      direction="vertical"
      size={8}
      style={{ width: '100%', minWidth: 1024 }}
    >
      {filteredTodos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </Space>
  );
}
