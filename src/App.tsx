import { ConfigProvider, theme, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TodoProvider } from './contexts/TodoContext';
import { LoginForm } from './components/LoginForm';
import { MainLayout } from './components/MainLayout';

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <TodoProvider>
      <MainLayout />
    </TodoProvider>
  );
}

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          colorBgContainer: '#161b22',
          colorBgElevated: '#1c2128',
          colorBgLayout: '#0d1117',
          colorBorder: 'rgba(255,255,255,0.08)',
          colorBorderSecondary: 'rgba(255,255,255,0.05)',
          colorText: '#e6edf3',
          colorTextSecondary: '#8b949e',
          colorTextTertiary: '#6e7681',
          borderRadius: 8,
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        components: {
          Card: {
            colorBgContainer: '#161b22',
          },
          Table: {
            colorBgContainer: '#161b22',
            headerBg: '#1c2128',
          },
          Modal: {
            contentBg: '#1c2128',
            headerBg: '#1c2128',
          },
          Input: {
            colorBgContainer: '#0d1117',
          },
          Select: {
            colorBgContainer: '#0d1117',
          },
          Tabs: {
            colorBgContainer: 'transparent',
          },
        },
      }}
    >
      <AntdApp>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
