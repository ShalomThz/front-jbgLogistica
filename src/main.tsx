import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@contexts/shared/ui/components";
import { Toaster } from "sonner";
import "./index.css";
import App from "./App.tsx";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from "@/lib/queryClient";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {import.meta.env.MODE === 'development' && (<ReactQueryDevtools initialIsOpen={false} />)}
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <App />
          <Toaster richColors position="top-right" expand offset={{ top: 72 }} />
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
