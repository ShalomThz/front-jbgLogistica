import { UserMenu } from './UserMenu';
import {
  AnimatedThemeToggler,
  SidebarTrigger,
  Separator,
} from '@contexts/shared/shadcn/components';

export const Header = () => {
  return (
    <header className="sticky top-0 z-10 shrink-0 h-16 bg-background border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
      </div>

      <div className="flex items-center gap-2">
        <AnimatedThemeToggler className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground" />
        <UserMenu />
      </div>
    </header>
  );
};
