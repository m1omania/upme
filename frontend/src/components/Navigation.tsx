import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { Button } from '@/components/ui/button';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useUserStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/swipe', label: 'Свайп' },
    { path: '/dashboard', label: 'Дашборд' },
    { path: '/profile', label: 'Профиль' },
  ];

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="flex items-center gap-4">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={location.pathname === item.path ? 'default' : 'ghost'}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="ml-auto">
          <Button variant="ghost" onClick={handleLogout}>
            Выход
          </Button>
        </div>
      </div>
    </nav>
  );
}
