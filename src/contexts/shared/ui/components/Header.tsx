import { UserMenu } from "./UserMenu";
import { NotificationDrawer } from "./NotificationDrawer";
import {
  AnimatedThemeToggler,
  SidebarTrigger,
  Separator,
} from "@contexts/shared/shadcn/components";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { notificationPolicies } from "@contexts/shared/domain/policies/notification.policy";

export const Header = () => {
  const { user } = useAuth();
  const canListNotifications = user ? notificationPolicies.list(user) : false;

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
        {canListNotifications && <NotificationDrawer />}
        <AnimatedThemeToggler className="inline-flex items-center justify-center rounded-md p-2 text-primary-foreground hover:bg-primary-foreground/15" />
        <UserMenu />
      </div>
    </header>
  );
};
