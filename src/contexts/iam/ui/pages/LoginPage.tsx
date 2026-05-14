import { LoginForm } from "../components/auth/LoginForm";

export const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 px-4">
      <div className="flex flex-col items-center w-full max-w-md">
        <h2 className="mb-6 text-3xl sm:text-4xl font-bold text-gray-800">
          JBG CARGO CORP
        </h2>

        <div className="w-full rounded-xl border border-border bg-card p-4 sm:p-6 shadow-lg">
          <h1 className="text-xl sm:text-2xl font-semibold text-center mb-4 sm:mb-6">
            Iniciar Sesión
          </h1>
          <LoginForm />
        </div>
      </div>
    </div>
  );
};
