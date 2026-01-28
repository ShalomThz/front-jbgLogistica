import { ModeToggle } from './ModeToggle';
import { UserMenu } from './UserMenu';
import {
  SidebarTrigger,
  Separator,
} from '@/shared/shadcn/components';

export const Header = () => {
  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
      </div>

      <div className="flex items-center gap-2">
        <ModeToggle />
        <UserMenu />
      </div>
    </header>
  );
};
