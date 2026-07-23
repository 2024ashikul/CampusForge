import React from 'react';
import { Cpu, Bell, Sun, Moon, LogOut, User as UserIcon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  name: string;
  href: string;
}

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/' },
    { name: 'Students', href: '/students' },
    { name: 'Projects', href: '/projects' },
    { name: 'Events', href: '/events' },
    { name: 'Clubs', href: '/clubs' },
    { name: 'Chat Workspace', href: '/chat' },
  ];

  // Derive initials from real user name
  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-card/80 backdrop-blur-xl border-b border-customBorder px-4 md:px-8 py-2.5 flex items-center justify-between select-none transition-all duration-300 shadow-lg">

      {/* LEFT: Branding */}
      <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/')}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent/30 via-cyan-500/20 to-purple-500/30 border border-accent/40 flex items-center justify-center group-hover:border-accent group-hover:shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all duration-300">
          <Cpu className="w-5 h-5 text-accent group-hover:scale-110 transition-transform duration-300" />
        </div>
        <span className="text-xl font-black tracking-tight text-accent font-sans uppercase glow-text">
          Campus<span className="text-mainText">Forge</span>
          <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent font-mono">v2.0</span>
        </span>
      </div>

      {/* CENTER: Futuristic Navigation Links */}
      <div className="hidden md:flex items-center space-x-1.5 bg-footer/60 backdrop-blur-md p-1 rounded-2xl border border-customBorder">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href);
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.href)}
              className={`relative px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-accent/15 text-accent border border-accent/40 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                  : 'text-subText hover:text-mainText hover:bg-primary/40 border border-transparent'
              }`}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      {/* RIGHT: High-Tech Actions */}
      <div className="flex items-center space-x-3">

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-primary/70 border border-customBorder text-subText hover:text-accent hover:border-accent/40 transition-all cursor-pointer flex items-center justify-center shadow-sm"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-accent animate-[spin_16s_linear_infinite]" />
          ) : (
            <Moon className="w-4 h-4 text-accent" />
          )}
        </button>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-xl bg-primary/70 border border-customBorder text-subText hover:text-accent hover:border-accent/40 transition-all focus:outline-none cursor-pointer">
          <Bell className="w-4 h-4 text-accent" />
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
        </button>

        {/* Profile Avatar & Quick Link */}
        <button
          onClick={() => navigate(user ? `/profile/${user.id}` : '/')}
          title={user?.name || 'Profile'}
          className="flex items-center space-x-2 p-1 pr-2.5 rounded-xl bg-primary/80 border border-customBorder hover:border-accent/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-accent via-cyan-500 to-purple-600 text-primary font-black text-xs tracking-wider shadow-sm group-hover:scale-105 transition-transform">
            {userInitials}
          </div>
          <span className="text-xs font-semibold text-mainText hidden lg:inline max-w-[100px] truncate">
            {user?.name || 'User'}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 rounded-xl bg-primary/70 border border-customBorder text-subText hover:text-red-400 hover:border-red-500/40 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>

      </div>
    </nav>
  );
};

export default Navbar;