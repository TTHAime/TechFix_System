import { NavLink } from 'react-router';
import { useAuthStore } from '@/stores/auth';
import {
  LayoutDashboard,
  Wrench,
  Monitor,
  Users,
  Building2,
  Shield,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const { user, logout, hasRole } = useAuthStore();
  if (!user) return null;

  const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  ];

  // Repair requests — all roles can see (user sees own, tech sees assigned, admin/hr sees all)
  navItems.push({ to: '/requests', label: 'Repair Requests', icon: <Wrench className="h-4 w-4" /> });

  // Equipment — admin, technician
  if (hasRole('admin', 'technician')) {
    navItems.push({ to: '/equipment', label: 'Equipment', icon: <Monitor className="h-4 w-4" /> });
  }

  // Users — admin, hr
  if (hasRole('admin', 'hr')) {
    navItems.push({ to: '/users', label: 'Users', icon: <Users className="h-4 w-4" /> });
  }

  // Departments — admin, hr
  if (hasRole('admin', 'hr')) {
    navItems.push({ to: '/departments', label: 'Departments', icon: <Building2 className="h-4 w-4" /> });
  }

  // Roles — admin only
  if (hasRole('admin')) {
    navItems.push({ to: '/roles', label: 'Roles', icon: <Shield className="h-4 w-4" /> });
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 font-bold text-lg">
        <Wrench className="h-6 w-6 text-primary" />
        TechFix
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* User info + logout */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{user.role.name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} title="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
