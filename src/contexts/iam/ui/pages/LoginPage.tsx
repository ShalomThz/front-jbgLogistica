import { DottedMap, MorphingText } from "@contexts/shared/shadcn";

import { LoginForm } from "../components/auth/LoginForm";

export const LoginPage = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden px-4">
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <DottedMap
          preserveAspectRatio="xMidYMid slice"
          dotRadius={0.25}
          className="absolute inset-0 w-full h-full opacity-50 sm:opacity-60"
        />
      </div>
      <MorphingText
        texts={["JBG", "Cargo", "Corp", "Logística"]}
        className="absolute z-10 top-8 sm:top-12 h-12 sm:h-16 md:h-20 text-3xl sm:text-5xl md:text-6xl text-foreground"
      />

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
