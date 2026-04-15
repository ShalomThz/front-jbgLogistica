import { UserMenu } from "./UserMenu";
import {
  AnimatedThemeToggler,
  SidebarTrigger,
  Separator,
} from "@contexts/shared/shadcn/components";

export const Header = () => {
  return (
    <header className="sticky top-0 z-10 shrink-0 h-16 bg-primary shadow-md shadow-primary/50 flex items-center justify-between px-4 text-primary-foreground">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" />
        <Separator
          orientation="vertical"
          className="h-4 bg-primary-foreground/30"
        />
      </div>

      <div className="flex items-center gap-2">
        <AnimatedThemeToggler className="inline-flex items-center justify-center rounded-md p-2 text-primary-foreground hover:bg-primary-foreground/15" />
        <UserMenu />
      </div>
    </header>
  );
};
