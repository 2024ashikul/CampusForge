import React, { useState } from 'react';
import { Settings, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext'; // Make sure this path correctly targets your ThemeContext file

interface NavItem {
  name: string;
  href: string;
}

export const Navbar: React.FC = () => {
  // Connect directly to our master top-level theme engine context pool
  const { theme, toggleTheme } = useTheme();

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '#dashboard' },
    { name: 'Students', href: '#students' },
    { name: 'Projects', href: '#projects' },
    { name: 'Events', href: '#events' },
    { name: 'Clubs', href: '#clubs' },
    { name: 'Trending', href: '#trending' },
  ];

  const [activeTab, setActiveTab] = useState<string>('Students');

  return (
    // REFACTORED: bg-card and border-customBorder adapt instantly to light/dark modes
    <nav className="w-full bg-card border-b border-customBorder px-6 py-3 flex items-center justify-between select-none transition-colors duration-200">
      
      {/* LEFT: Branding & Logo */}
      <div className="flex items-center space-x-2 cursor-pointer group">
        {/* REFACTORED: text-subText scales naturally */}
        <Settings className="w-6 h-6 text-subText group-hover:rotate-45 transition-transform duration-300 ease-out" />
        
        {/* REFACTORED: text-accent pulls from our unified brand configuration variables */}
        <span className="text-xl font-black tracking-tight text-accent font-sans uppercase">
          Campus<span>Forge</span>
        </span>
      </div>

      {/* CENTER: Navigation Links */}
      <div className="hidden md:flex items-center space-x-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out cursor-pointer ${
                isActive
                  ? 'bg-footer text-accent' // REFACTORED: active styling scales using tokens
                  : 'text-subText hover:text-mainText hover:bg-primary/50' // REFACTORED: secondary states
              }`}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      {/* RIGHT: Actions (Notification, Central Theme Switch, Profile) */}
      <div className="flex items-center space-x-4">
        
        {/* INTERACTIVE CENTRAL THEME SWITCH CONTROL NODE */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-primary border border-customBorder text-subText hover:text-mainText hover:border-slate-400/40 transition-all cursor-pointer flex items-center justify-center"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-accent animate-[spin_12s_linear_infinite]" />
          ) : (
            <Moon className="w-4 h-4 text-accent" />
          )}
        </button>

        {/* Notification Bell */}
        <button className="relative p-1 text-accent hover:text-accentHover transition-colors focus:outline-none cursor-pointer">
          <Bell className="w-6 h-6 fill-current text-accent" />
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accentHover"></span>
          </span>
        </button>

        {/* Profile Avatar Initials */}
        <button className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-b from-accent to-accent/80 text-primary font-bold text-sm tracking-wide shadow-md hover:brightness-110 transition-all focus:outline-none border border-customBorder cursor-pointer">
          NS
        </button>
      </div>
      
    </nav>
  );
};

export default Navbar;