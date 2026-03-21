import { useAuthStore } from '@/stores/auth';

export function Header() {
  const { user } = useAuthStore();
  if (!user) return null;

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {user.department.name}
        </span>
      </div>
    </header>
  );
}
