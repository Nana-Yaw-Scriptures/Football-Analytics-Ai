/**
 * ThemeContext.js
 * Save as: src/context/ThemeContext.js
 * 
 * Provides theme state (dark/light) across the app.
 * Persists choice in localStorage.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('fa-theme');
    return saved || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('fa-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    // Also set body background for any bleed-through
    document.body.style.backgroundColor = theme === 'dark' ? '#0a0e1a' : '#f0f2f591';
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}