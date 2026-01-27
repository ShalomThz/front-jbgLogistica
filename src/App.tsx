import { useRoutes } from 'react-router-dom';
import { useAuth, LoginForm } from '@/contexts/users/AuthenticateUser';
import { DashboardLayout } from '@/shared/ui';
import { routes } from '@/shared/ui/router';

function App() {
  const { isLoading, isAuthenticated } = useAuth();
  const routeElement = useRoutes(routes);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h1>
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {routeElement}
    </DashboardLayout>
  );
}

export default App;
