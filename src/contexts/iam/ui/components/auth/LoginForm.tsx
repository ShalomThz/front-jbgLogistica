import { useState, type FormEvent } from "react";
import { loginRequestSchema } from "../../../domain";
import { useAuth } from "../../../infrastructure/hooks";
import { Button, Input, Label } from "@/shared/shadcn";

export const LoginForm = () => {
  const { login, loginError, isLoggingIn, resetLoginError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    resetLoginError();

    const result = loginRequestSchema.safeParse({ email, password });

    if (!result.success) {
      const firstError = result.error.issues[0];
      setValidationError(firstError.message);
      return;
    }

    await login(result.data);
  };

  const error = validationError || loginError;

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      {error && (
        <div
          role="alert"
          className="p-2 sm:p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-xs sm:text-sm"
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoggingIn}
          required
          placeholder="correo@ejemplo.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoggingIn}
          required
          placeholder="••••••••"
        />
      </div>

      <Button type="submit" disabled={isLoggingIn} className="w-full">
        {isLoggingIn ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  );
};
