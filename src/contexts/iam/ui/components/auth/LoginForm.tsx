import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginRequestSchema,
  type LoginRequestPrimitives,
} from "@contexts/iam/application/login/LoginRequest";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { Button, Input, Label } from "@contexts/shared/shadcn";

export const LoginForm = () => {
  const { login, loginError, isLoggingIn, resetLoginError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequestPrimitives>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (data) => {
    resetLoginError();
    await login(data);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3 sm:space-y-4">
      {loginError && (
        <div
          role="alert"
          className="p-2 sm:p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-xs sm:text-sm"
        >
          {loginError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          disabled={isLoggingIn}
          placeholder="correo@ejemplo.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          disabled={isLoggingIn}
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoggingIn} className="w-full">
        {isLoggingIn ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  );
};
