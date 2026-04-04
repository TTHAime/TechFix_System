import { NavLink, useLocation } from 'react-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useSidebarStore } from '@/stores/sidebar';
import {
  LayoutDashboard,
  Wrench,
  Monitor,
  Users,
  Building2,
  Shield,
  LogOut,
  ScrollText,
  FolderOpen,
  X,
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

function SidebarContent() {
  const { user, logout, hasRole } = useAuthStore();
  const close = useSidebarStore((s) => s.close);
  if (!user) return null;

  const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  ];

  navItems.push({ to: '/requests', label: 'Repair Requests', icon: <Wrench className="h-4 w-4" /> });

  if (hasRole('admin', 'technician')) {
    navItems.push({ to: '/equipment', label: 'Equipment', icon: <Monitor className="h-4 w-4" /> });
  }

  if (hasRole('admin', 'hr')) {
    navItems.push({ to: '/users', label: 'Users', icon: <Users className="h-4 w-4" /> });
  }

  if (hasRole('admin', 'hr')) {
    navItems.push({ to: '/departments', label: 'Departments', icon: <Building2 className="h-4 w-4" /> });
  }

  if (hasRole('admin')) {
    navItems.push({ to: '/equipment-categories', label: 'Categories', icon: <FolderOpen className="h-4 w-4" /> });
  }

  if (hasRole('admin')) {
    navItems.push({ to: '/roles', label: 'Roles', icon: <Shield className="h-4 w-4" /> });
  }

  if (hasRole('admin')) {
    navItems.push({ to: '/logs', label: 'System Logs', icon: <ScrollText className="h-4 w-4" /> });
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Wrench className="h-6 w-6 text-primary" />
          TechFix
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={close}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={close}
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
    </>
  );
}

export function Sidebar() {
  const { open, close } = useSidebarStore();
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    close();
  }, [location.pathname, close]);

  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={close}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground md:hidden animate-in slide-in-from-left duration-200">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
