import type { ReactNode } from "react";
import { UserMenu } from "../components/UserMenu";
import { AnimatedThemeToggler } from "@contexts/shared/shadcn/components";

interface CustomerLayoutProps {
  children: ReactNode;
}

export const CustomerLayout = ({ children }: CustomerLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 shrink-0 h-16 bg-primary shadow-md shadow-primary/50 flex items-center justify-between px-4 text-primary-foreground">
        <span className="font-semibold text-primary-foreground">JBG Logística</span>
        <div className="flex items-center gap-2">
          <AnimatedThemeToggler className="inline-flex items-center justify-center rounded-md p-2 text-primary-foreground hover:bg-primary-foreground/15" />
          <UserMenu />
        </div>
      </header>
      <div className="flex-1 p-6 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};
