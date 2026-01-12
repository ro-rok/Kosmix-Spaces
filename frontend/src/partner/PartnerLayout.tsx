import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Building2, FileText, Plus, Menu, X, LogOut, LayoutDashboard, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/partner" },
  { icon: FileText, label: "My Listings", href: "/partner/listings" },
  { icon: Plus, label: "Submit New", href: "/partner/listings/new" },
];

export function PartnerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/partner/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <img 
            src="/favicon-32x32.png" 
            alt="Kosmix Spaces" 
            className="h-5 w-5"
          />
          <span className="font-display font-semibold text-sm truncate max-w-[120px]">
            {user.workspaceBrandName || 'Partner'}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-card">
          <div className="flex h-14 items-center gap-2 border-b border-border px-6">
            <img 
              src="/favicon-32x32.png" 
              alt="Kosmix Spaces" 
              className="h-5 w-5"
            />
            <span className="font-display font-semibold truncate">{user.workspaceBrandName || 'Partner Portal'}</span>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-border p-4">
            <div className="mb-3 px-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">{user.contactName || user.email}</p>
              <p className="truncate">{user.email}</p>
              {user.status && (
                <p className="text-xs mt-1">
                  Status: <span className="font-medium">{user.status}</span>
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border">
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <div className="flex items-center gap-2">
                  <img 
                    src="/favicon-32x32.png" 
                    alt="Kosmix Spaces" 
                    className="h-5 w-5"
                  />
                  <span className="font-display font-semibold text-sm truncate">
                    {user.workspaceBrandName || 'Partner'}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="space-y-1 p-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      location.pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="border-t border-border p-4">
                <div className="mb-3 px-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">{user.contactName || user.email}</p>
                  <p className="truncate">{user.email}</p>
                  {user.status && (
                    <p className="text-xs mt-1">
                      Status: <span className="font-medium">{user.status}</span>
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 lg:pl-64">
          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
