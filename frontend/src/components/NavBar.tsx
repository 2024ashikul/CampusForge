import React, { useState } from 'react';
import { Cpu, Sun, Moon, LogOut, Menu, X, LayoutDashboard, Users, FolderKanban, CalendarDays, Building2, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserAvatar } from './ui/UserAvatar';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Clubs', href: '/clubs', icon: <Building2 className="w-4 h-4" /> },
    { name: 'Events', href: '/events', icon: <CalendarDays className="w-4 h-4" /> },
    { name: 'Projects', href: '/projects', icon: <FolderKanban className="w-4 h-4" /> },
    { name: 'Students', href: '/students', icon: <Users className="w-4 h-4" /> },
    { name: 'Skills', href: '/skills', icon: <Sparkles className="w-4 h-4" /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  return (
    <nav className="sticky top-0 z-40 w-full bg-card border-b border-customBorder">
      <div className="max-w-[1180px] mx-auto px-4 md:px-5 h-14 flex items-center justify-between">

        {/* Brand */}
        <button
          className="flex items-center gap-2 group cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-[#101614] transition-colors">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-[15px] font-bold tracking-tight hidden sm:block text-mainText">
            Campus<span className="text-accent">Forge</span>
          </span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.href)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                isActive(item.href)
                  ? 'bg-accent/15 text-accent'
                  : 'text-subText hover:text-mainText hover:bg-footer'
              }`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-subText hover:text-accent hover:bg-footer transition-all cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => navigate(user ? `/profile/${user.student_id}` : '/')}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-footer transition-all cursor-pointer"
          >
            <UserAvatar name={user?.name || 'User'} src={user?.profile_pic} className="h-7 w-7 rounded-md font-bold text-[10px]" textClassName="text-[10px]" />
            <span className="text-xs font-semibold text-mainText hidden md:inline max-w-[90px] truncate">
              {user?.name?.split(' ')[0] || 'User'}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md text-subText hover:text-red-400 hover:bg-footer transition-all cursor-pointer hidden sm:block"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-md text-subText hover:text-mainText lg:hidden cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-customBorder bg-card px-4 py-3 grid grid-cols-3 gap-1">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => { navigate(item.href); setMobileOpen(false); }}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-[10px] font-semibold cursor-pointer ${
                isActive(item.href) ? 'bg-accent/15 text-accent' : 'text-subText'
              }`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
