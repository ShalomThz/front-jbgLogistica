import { useAuth } from '@/contexts/users/AuthenticateUser';

export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        {/* Breadcrumb o título de página */}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.role}</p>
        </div>
        <button
          onClick={() => logout()}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Salir
        </button>
      </div>
    </header>
  );
};
