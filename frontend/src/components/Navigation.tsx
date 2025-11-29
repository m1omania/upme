import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart3, User, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FiltersDialog from './FiltersDialog';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const navItems = [
    { path: '/swipe', label: 'Свайп', icon: Home },
    { path: '/dashboard', label: 'Прогресс', icon: BarChart3 },
    { path: '/profile', label: 'Профиль', icon: User },
  ];

  const isActive = (path: string) => {
    if (path === '/swipe') {
      return location.pathname === '/swipe' || location.pathname.startsWith('/swipe/');
    }
    return location.pathname === path;
  };

  const isSwipePage = location.pathname === '/swipe' || location.pathname.startsWith('/swipe/');

  return (
    <>
      {/* Top Bar - Only on Swipe Page */}
      {isSwipePage && (
        <nav className="flex bg-background sticky top-0 z-50">
          <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4 w-full">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/swipe')}
                className="text-lg md:text-xl font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                UpMe
              </button>
            </div>
            
            {/* Navigation Items - Desktop Only */}
            <div className="hidden md:flex items-center gap-4 flex-1 justify-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
            
            {/* Filters Button */}
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiltersOpen(true)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Фильтры</span>
              </Button>
            </div>
          </div>
        </nav>
      )}

      {/* Desktop Navigation - Top Bar (for other pages) */}
      {!isSwipePage && (
        <nav className="hidden md:flex border-b bg-background sticky top-0 z-50">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 w-full">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/swipe')}
                className="text-xl font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                UpMe
              </button>
            </div>
            
            {/* Navigation Items */}
            <div className="flex items-center gap-4 flex-1 justify-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Mobile Navigation - Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50 shadow-lg">
        <div className="flex items-center justify-around h-16 px-2 pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-colors ${
                  active
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Filters Dialog */}
      <FiltersDialog open={filtersOpen} onOpenChange={setFiltersOpen} />
    </>
  );
}
