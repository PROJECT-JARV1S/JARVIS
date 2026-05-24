import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeType = 'jarvis' | 'cyberpunk' | 'amber';

interface ThemeContextProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('jarvis_theme');
    if (saved === 'jarvis' || saved === 'cyberpunk' || saved === 'amber') {
      return saved as ThemeType;
    }
    return 'jarvis';
  });

  const setTheme = (newTheme: ThemeType) => {
    localStorage.setItem('jarvis_theme', newTheme);
    setThemeState(newTheme);
  };

  useEffect(() => {
    // Apply theme class to both html and body tags to ensure all variables cascade correctly
    const root = document.documentElement;
    const body = document.body;
    
    root.classList.remove('theme-jarvis', 'theme-cyberpunk', 'theme-amber');
    body.classList.remove('theme-jarvis', 'theme-cyberpunk', 'theme-amber');
    
    root.classList.add(`theme-${theme}`);
    body.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
