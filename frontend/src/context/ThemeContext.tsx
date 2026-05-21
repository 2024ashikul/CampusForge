import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read saved preference from localStorage, default to dark if empty
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('campusforge-theme') as Theme) || 'dark';
  });

  // FIXED: Consolidated into a single, clean observer hook
  useEffect(() => {
    const root = window.document.documentElement;
    
    // 1. This updates your global Tailwind v4 CSS variables
    root.setAttribute('data-theme', theme);
    
    // 2. This tells the UIW Markdown editor to switch its colors automatically
    root.setAttribute('data-color-mode', theme);
    
    // 3. Save the selection to the browser's memory
    localStorage.setItem('campusforge-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be evaluated inside a ThemeProvider wrapper.');
  return context;
};