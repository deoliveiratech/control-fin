import { Navigate } from 'react-router-dom';
import { useAuth } from '../firebase/AuthProvider';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
}

export default PrivateRoute;
