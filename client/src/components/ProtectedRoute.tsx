import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // 🚀 开发模式：临时允许访问所有页面进行测试
  // 生产环境请删除此部分
  if (import.meta.env.DEV) {
    console.log('🔧 开发模式：跳过认证检查，允许访问所有页面');
    return <>{children}</>;
  }

  // 生产模式：正常的认证检查
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 