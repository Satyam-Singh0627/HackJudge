import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User } from '../types';

interface ProtectedRouteProps {
  currentUser: User | null;
  allowedRoles?: string[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  currentUser,
  allowedRoles,
  children
}) => {
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const roleUpper = currentUser.role.toUpperCase();
    const hasRole = allowedRoles.map(r => r.toUpperCase()).includes(roleUpper);

    if (!hasRole) {
      // Redirect to their assigned portal
      switch (roleUpper) {
        case 'ADMIN':
          return <Navigate to="/admin/dashboard" replace />;
        case 'ORGANIZER':
          return <Navigate to="/organizer/dashboard" replace />;
        case 'JUDGE':
          return <Navigate to="/judge/dashboard" replace />;
        default:
          return <Navigate to="/participant/dashboard" replace />;
      }
    }
  }

  return <>{children}</>;
};
