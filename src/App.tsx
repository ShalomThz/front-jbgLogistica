import { useRoutes } from 'react-router-dom';
import { useAuth, LoginForm } from '@/contexts/users/AuthenticateUser';
import { DashboardLayout } from '@/shared/ui';
import { routes } from '@/shared/ui/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/components/ui';

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
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
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
