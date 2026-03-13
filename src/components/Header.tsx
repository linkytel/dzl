import { useState, useMemo } from 'react';
import {
  Layout,
  Space,
  Button,
  Dropdown,
  Avatar,
  Modal,
  Form,
  Input,
  Typography,
  Segmented,
  message,
  Select,
  Divider,
  List,
  Popconfirm,
  Tag,
} from 'antd';
import {
  UserOutlined,
  SwapOutlined,
  LogoutOutlined,
  BulbOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  ScheduleOutlined,
  FolderOutlined,
  PlusOutlined,
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import match from 'pinyin-match';
import { useAuth } from '../contexts/AuthContext';
import { useTodos } from '../contexts/TodoContext';
import type { ViewMode, Project, Visibility } from '../types';

const { Header } = Layout;
const { Text } = Typography;
const { TextArea } = Input;

const VISIBILITY_LABELS: Record<Visibility, string> = {
  all: '所有人可见',
  self: '仅自己可见',
  members: '指定成员可见',
  none: '不可见',
};

export function AppHeader() {
  const { currentUser, users, logout, switchUser, error, clearError } =
    useAuth();
  const {
    viewMode,
    setViewMode,
    projects,
    currentProjectId,
    setCurrentProjectId,
    addProject,
    updateProject,
    deleteProject,
  } = useTodos();

  const [switchModal, setSwitchModal] = useState(false);
  const [projectModal, setProjectModal] = useState(false);
  const [manageProjectModal, setManageProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [visibilityProject, setVisibilityProject] = useState<Project | null>(
    null,
  );
  const [switchLoading, setSwitchLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);

  const [userForm] = Form.useForm();
  const [projectForm] = Form.useForm();
  const [editProjectForm] = Form.useForm();
  const [visibilityForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const handleSwitchUser = async (values: {
    name: string;
    password: string;
  }) => {
    setSwitchLoading(true);
    clearError();
    try {
      await switchUser(values.name.trim(), values.password.trim());
      setSwitchModal(false);
      userForm.resetFields();
      messageApi.success(`已切换到用户: ${values.name.trim()}`);
    } catch {
      /* error via context */
    } finally {
      setSwitchLoading(false);
    }
  };

  const openSwitchUserModal = (name?: string) => {
    userForm.resetFields();
    if (name) userForm.setFieldsValue({ name });
    clearError();
    setSwitchModal(true);
  };

  const handleAddProject = async (values: {
    name: string;
    description: string;
  }) => {
    if (!currentUser) return;
    setProjectLoading(true);
    try {
      await addProject(
        values.name.trim(),
        values.description?.trim() || '',
        currentUser.id,
      );
      setProjectModal(false);
      projectForm.resetFields();
      messageApi.success(`项目 ${values.name} 添加成功`);
    } catch {
      messageApi.error('添加项目失败');
    } finally {
      setProjectLoading(false);
    }
  };

  const handleEditProject = async (values: {
    name: string;
    description: string;
  }) => {
    if (!editingProject) return;
    setProjectLoading(true);
    try {
      await updateProject(editingProject.id, {
        name: values.name.trim(),
        description: values.description?.trim() || '',
      });
      setEditingProject(null);
      editProjectForm.resetFields();
      messageApi.success('更新成功');
    } catch {
      messageApi.error('更新失败');
    } finally {
      setProjectLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id);
      messageApi.success('删除成功');
    } catch {
      messageApi.error('删除失败');
    }
  };

  const handleVisibilitySave = async (values: {
    visibility: Visibility;
    visibleMembers: string[];
  }) => {
    if (!visibilityProject) return;
    setProjectLoading(true);
    try {
      await updateProject(visibilityProject.id, {
        visibility: values.visibility,
        visibleMembers: values.visibleMembers || [],
      });
      setVisibilityProject(null);
      visibilityForm.resetFields();
      messageApi.success('可见性设置已更新');
    } catch {
      messageApi.error('更新失败');
    } finally {
      setProjectLoading(false);
    }
  };

  const isOwner = (proj: Project) => proj.ownerId === currentUser?.id;

  const userMenuItems = [
    {
      key: 'current',
      label: (
        <div style={{ padding: '4px 0' }}>
          <Text strong style={{ display: 'block' }}>
            {currentUser?.name}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            当前用户
          </Text>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    ...users
      .filter((u) => u.id !== currentUser?.id)
      .map((u) => ({
        key: u.id,
        icon: <UserOutlined />,
        label: u.name,
        onClick: () => openSwitchUserModal(u.name),
      })),
    ...(users.filter((u) => u.id !== currentUser?.id).length > 0
      ? [{ type: 'divider' as const }]
      : []),
    {
      key: 'switch',
      icon: <SwapOutlined />,
      label: '切换用户',
      onClick: () => openSwitchUserModal(),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: logout,
    },
  ];

  const viewOptions: { value: ViewMode; label: React.ReactNode }[] = [
    {
      value: 'list',
      label: (
        <Space size={4}>
          <UnorderedListOutlined />
          列表
        </Space>
      ),
    },
    {
      value: 'month',
      label: (
        <Space size={4}>
          <CalendarOutlined />
          按月
        </Space>
      ),
    },
    {
      value: 'day',
      label: (
        <Space size={4}>
          <ScheduleOutlined />
          按日
        </Space>
      ),
    },
  ];

  const projectOptions = useMemo(
    () => projects.map((p) => ({ label: p.name, value: p.id })),
    [projects],
  );

  const visibilityWatch = Form.useWatch('visibility', visibilityForm);

  return (
    <>
      {contextHolder}
      <Header className="app-header">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            height: '100%',
            width: '100%',
          }}
        >
          {/* Project Switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '4px 12px 4px 6px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #faad14, #fa8c16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BulbOutlined style={{ fontSize: 16, color: '#fff' }} />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                minWidth: 150,
              }}
            >
              <Text
                type="secondary"
                style={{ fontSize: 10, paddingLeft: 11, marginBottom: -6 }}
              >
                灵光一现
              </Text>
              <Select
                value={currentProjectId}
                onChange={setCurrentProjectId}
                variant="borderless"
                style={{ width: '100%' }}
                dropdownStyle={{ minWidth: 220 }}
                showSearch={projects.length > 10}
                filterOption={(input, option) => {
                  if (!input) return true;
                  return !!match.match(option?.label as string, input);
                }}
                options={projectOptions}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: '4px 0' }} />
                    <div
                      style={{ padding: '4px 8px', display: 'flex', gap: 8 }}
                    >
                      <Button
                        type="text"
                        block
                        icon={<PlusOutlined />}
                        onClick={() => setProjectModal(true)}
                      >
                        新建
                      </Button>
                      <Button
                        type="text"
                        block
                        icon={<SettingOutlined />}
                        onClick={() => setManageProjectModal(true)}
                      >
                        管理
                      </Button>
                    </div>
                  </>
                )}
              />
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <Segmented
              value={viewMode}
              onChange={(v) => setViewMode(v as ViewMode)}
              options={viewOptions}
              size="small"
            />
          </div>

          <Dropdown
            menu={{ items: userMenuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 36,
                padding: '0 8px',
              }}
            >
              <Avatar
                size={24}
                style={{
                  background: 'linear-gradient(135deg, #36d399, #22d3ee)',
                  color: '#000',
                  fontWeight: 600,
                }}
              >
                {currentUser?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </Button>
          </Dropdown>
        </div>
      </Header>

      {/* Switch User Modal */}
      <Modal
        title="切换用户"
        open={switchModal}
        onCancel={() => {
          setSwitchModal(false);
          clearError();
        }}
        footer={null}
        width={380}
        destroyOnClose
      >
        {error && (
          <div style={{ marginBottom: 16 }}>
            <Text type="danger">{error}</Text>
          </div>
        )}
        <Form
          form={userForm}
          layout="vertical"
          onFinish={handleSwitchUser}
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setSwitchModal(false);
                  clearError();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={switchLoading}>
                确认切换
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Project Modal */}
      <Modal
        title="新建项目"
        open={projectModal}
        onCancel={() => {
          setProjectModal(false);
          projectForm.resetFields();
        }}
        footer={null}
        width={400}
        destroyOnClose
      >
        <Form
          form={projectForm}
          layout="vertical"
          onFinish={handleAddProject}
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input prefix={<FolderOutlined />} placeholder="如：鞋包出海计划" />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <TextArea
              placeholder="简单描述一下项目的目标和范围..."
              rows={3}
              style={{ resize: 'none' }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setProjectModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={projectLoading}>
                创建项目
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Manage Projects Modal */}
      <Modal
        title="管理项目"
        open={manageProjectModal}
        onCancel={() => {
          setManageProjectModal(false);
          setEditingProject(null);
        }}
        footer={null}
        width={540}
      >
        <List
          itemLayout="horizontal"
          dataSource={projects}
          renderItem={(item) => (
            <List.Item
              actions={[
                ...(isOwner(item)
                  ? [
                      <Button
                        key="visibility"
                        type="text"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => {
                          setVisibilityProject(item);
                          visibilityForm.setFieldsValue({
                            visibility: item.visibility,
                            visibleMembers: item.visibleMembers,
                          });
                        }}
                      />,
                    ]
                  : []),
                <Button
                  key="edit"
                  type="text"
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => {
                    setEditingProject(item);
                    editProjectForm.setFieldsValue({
                      name: item.name,
                      description: item.description,
                    });
                  }}
                />,
                <Popconfirm
                  key="delete"
                  title="确定删除这个项目？"
                  onConfirm={() => handleDeleteProject(item.id)}
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                  />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    {item.name}
                    {isOwner(item) && (
                      <Tag color="gold" style={{ fontSize: 10 }}>
                        Owner
                      </Tag>
                    )}
                  </Space>
                }
                description={
                  <>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {VISIBILITY_LABELS[item.visibility]}
                    </Text>
                    {item.description && <> · {item.description}</>}
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        title="编辑项目"
        open={!!editingProject}
        onCancel={() => {
          setEditingProject(null);
          editProjectForm.resetFields();
        }}
        footer={null}
        width={400}
        destroyOnClose
      >
        <Form
          form={editProjectForm}
          layout="vertical"
          onFinish={handleEditProject}
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input prefix={<FolderOutlined />} />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <TextArea rows={3} style={{ resize: 'none' }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setEditingProject(null)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={projectLoading}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Visibility Settings Modal */}
      <Modal
        title="设置项目可见性"
        open={!!visibilityProject}
        onCancel={() => {
          setVisibilityProject(null);
          visibilityForm.resetFields();
        }}
        footer={null}
        width={440}
        destroyOnClose
      >
        <Form
          form={visibilityForm}
          layout="vertical"
          onFinish={handleVisibilitySave}
          requiredMark={false}
        >
          <Form.Item
            name="visibility"
            label="可见性"
            rules={[{ required: true }]}
          >
            <Select
              options={Object.entries(VISIBILITY_LABELS).map(([k, v]) => ({
                value: k,
                label: v,
              }))}
            />
          </Form.Item>
          {visibilityWatch === 'members' && (
            <Form.Item name="visibleMembers" label="可见成员">
              <Select
                mode="multiple"
                placeholder="选择成员"
                options={users.map((u) => ({ value: u.id, label: u.name }))}
              />
            </Form.Item>
          )}
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setVisibilityProject(null)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={projectLoading}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
