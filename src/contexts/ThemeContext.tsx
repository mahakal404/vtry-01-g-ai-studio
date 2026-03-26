import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserTheme, DEFAULT_THEME } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ThemeContextType {
  theme: UserTheme;
  setTheme: (theme: UserTheme) => void;
  resetTheme: () => void;
  saveTheme: (theme: UserTheme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile, user } = useAuth();
  const [theme, setThemeState] = useState<UserTheme>(DEFAULT_THEME);

  useEffect(() => {
    if (profile?.theme) {
      setThemeState(profile.theme);
    } else {
      setThemeState(DEFAULT_THEME);
    }
  }, [profile]);

  useEffect(() => {
    // Apply theme to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--background', theme.background);
    root.style.setProperty('--card', theme.card);
    root.style.setProperty('--text', theme.text);
    root.style.setProperty('--muted', theme.muted);
    root.style.setProperty('--border', theme.border);
    
    if (theme.isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const setTheme = (newTheme: UserTheme) => {
    setThemeState(newTheme);
  };

  const resetTheme = () => {
    setThemeState(DEFAULT_THEME);
  };

  const saveTheme = async (newTheme: UserTheme) => {
    if (user) {
      const userDoc = doc(db, 'users', user.uid);
      await updateDoc(userDoc, { theme: newTheme });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resetTheme, saveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
