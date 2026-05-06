import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';

export default function ProtectedRoute({ children }: any) {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/signin" />;
  }

  return children;
}