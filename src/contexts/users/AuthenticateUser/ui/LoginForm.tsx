import { useState, type FormEvent } from 'react';
import { LoginCredentialsSchema } from '../domain';
import { useAuth } from '../infrastructure/hooks';

export const LoginForm = () => {
  const { login, loginError, isLoggingIn, resetLoginError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    resetLoginError();

    const result = LoginCredentialsSchema.safeParse({ email, password });

    if (!result.success) {
      const firstError = result.error.issues[0];
      setValidationError(firstError.message);
      return;
    }

    await login(result.data);
  };

  const error = validationError || loginError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm"
        >
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoggingIn}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          placeholder="correo@ejemplo.com"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoggingIn}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoggingIn}
        className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoggingIn ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
};
