import { EncryptedText, Globe } from "@contexts/shared/shadcn";

import warehouseBg from "@/assets/Warehouse filled with packed boxes.png";
import { LoginForm } from "../components/auth/LoginForm";

export const LoginPage = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden px-4">
      <div
        className="absolute inset-0 lg:hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${warehouseBg})` }}
        aria-hidden
      />
      <div className="absolute inset-0 lg:hidden bg-background/70 backdrop-blur-sm" aria-hidden />
      <Globe className="hidden lg:block max-w-none! w-[150vh]! -top-[5%]" />
      <h2 className="absolute z-10 top-8 sm:top-12  tracking-tight text-foreground flex items-baseline gap-2">
        <span className="text-2xl sm:text-4xl font-bold">
          <EncryptedText text="JBG" />
        </span>
        <span className="text-2xl sm:text-4xl">
          <EncryptedText text="Cargo Corp" />
        </span>
      </h2>
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        <div className="w-full rounded-xl border border-border/40 bg-card/60 p-4 sm:p-6 shadow-lg backdrop-blur-xl">
          <h1 className="text-xl sm:text-2xl font-semibold text-center mb-4 sm:mb-6">
            Iniciar Sesión
          </h1>
          <LoginForm />
        </div>
      </div>
    </div>
  );
};
