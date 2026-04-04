import { useAuthStore } from '@/stores/auth';
import { useSidebarStore } from '@/stores/sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export function Header() {
  const { user } = useAuthStore();
  const toggle = useSidebarStore((s) => s.toggle);
  if (!user) return null;

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggle}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="hidden md:block" />
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {user.department.name}
        </span>
      </div>
    </header>
  );
}
