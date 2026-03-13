import { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Segmented } from 'antd';
import { UserOutlined, LockOutlined, RocketOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

export function LoginForm() {
  const { login, register, users, error, clearError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>(
    users.length === 0 ? 'register' : 'login',
  );
  const [form] = Form.useForm();

  const noUsers = users.length === 0;

  const handleSubmit = async (values: { name: string; password: string }) => {
    setLoading(true);
    clearError();
    try {
      if (mode === 'register' || noUsers) {
        await register(values.name.trim(), values.password.trim());
      } else {
        await login(values.name.trim(), values.password.trim());
      }
    } catch {
      // error handled by context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #1677ff, #722ed1)',
              marginBottom: 16,
              boxShadow: '0 8px 32px rgba(22, 119, 255, 0.25)',
            }}
          >
            <RocketOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <Title level={2} style={{ margin: 0, color: '#e6edf3' }}>
            灵光一现
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            记录你的每一次闪光点
          </Text>
        </div>

        {/* Login Card */}
        <Card
          bordered={false}
          style={{
            background: 'rgba(22, 27, 34, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {!noUsers && (
            <div style={{ marginBottom: 24 }}>
              <Segmented
                block
                value={mode}
                onChange={(v) => {
                  setMode(v as 'login' | 'register');
                  clearError();
                }}
                options={[
                  { label: '登录', value: 'login' },
                  { label: '注册', value: 'register' },
                ]}
              />
            </div>
          )}

          {noUsers && (
            <Alert
              message="还没有用户，请先创建一个账户"
              type="info"
              showIcon
              style={{
                marginBottom: 20,
                background: 'rgba(22, 119, 255, 0.08)',
                borderColor: 'rgba(22, 119, 255, 0.2)',
              }}
            />
          )}

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={clearError}
              style={{ marginBottom: 20 }}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="name"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#6e7681' }} />}
                placeholder="请输入你的姓名"
                id="login-name"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#6e7681' }} />}
                placeholder="请输入密码"
                id="login-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                id="login-submit"
                style={{
                  height: 44,
                  fontWeight: 500,
                  background: 'linear-gradient(135deg, #1677ff, #722ed1)',
                  border: 'none',
                }}
              >
                {mode === 'register' || noUsers ? '创建并登录' : '登录'}
              </Button>
            </Form.Item>
          </Form>

          {!noUsers && users.length > 0 && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                已有 {users.length} 个用户
              </Text>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
