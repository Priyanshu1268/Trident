import React, { createContext, useContext, useState, useEffect } from 'react';

export type NeonTheme = 'crimson' | 'cyan' | 'emerald' | 'amber' | 'purple';

export interface ThemeConfig {
  id: NeonTheme;
  name: string;
  accentColor: string;
  glowColor: string;
  gradientFrom: string;
  gradientTo: string;
  badgeBg: string;
  badgeBorder: string;
  activeTabClass: string;
  accentTextClass: string;
  glowClass: string;
  borderClass: string;
}

export const THEMES: Record<NeonTheme, ThemeConfig> = {
  crimson: {
    id: 'crimson',
    name: 'Cyber Crimson',
    accentColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    gradientFrom: 'from-red-600',
    gradientTo: 'to-rose-500',
    badgeBg: 'bg-red-950/80',
    badgeBorder: 'border-red-800/60',
    activeTabClass: 'bg-red-600 text-white shadow-lg shadow-red-600/30',
    accentTextClass: 'text-red-400',
    glowClass: 'shadow-red-500/20',
    borderClass: 'border-red-500/30',
  },
  cyan: {
    id: 'cyan',
    name: 'Electric Cyan',
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-blue-600',
    badgeBg: 'bg-cyan-950/80',
    badgeBorder: 'border-cyan-800/60',
    activeTabClass: 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/40 font-bold',
    accentTextClass: 'text-cyan-400',
    glowClass: 'shadow-cyan-500/25',
    borderClass: 'border-cyan-500/30',
  },
  emerald: {
    id: 'emerald',
    name: 'Matrix Emerald',
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-600',
    badgeBg: 'bg-emerald-950/80',
    badgeBorder: 'border-emerald-800/60',
    activeTabClass: 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/40 font-bold',
    accentTextClass: 'text-emerald-400',
    glowClass: 'shadow-emerald-500/25',
    borderClass: 'border-emerald-500/30',
  },
  amber: {
    id: 'amber',
    name: 'Solar Amber',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-600',
    badgeBg: 'bg-amber-950/80',
    badgeBorder: 'border-amber-800/60',
    activeTabClass: 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/40 font-bold',
    accentTextClass: 'text-amber-400',
    glowClass: 'shadow-amber-500/25',
    borderClass: 'border-amber-500/30',
  },
  purple: {
    id: 'purple',
    name: 'Ultraviolet Neon',
    accentColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-pink-500',
    badgeBg: 'bg-purple-950/80',
    badgeBorder: 'border-purple-800/60',
    activeTabClass: 'bg-purple-600 text-white shadow-lg shadow-purple-600/40',
    accentTextClass: 'text-purple-400',
    glowClass: 'shadow-purple-500/25',
    borderClass: 'border-purple-500/30',
  },
};

interface ThemeContextType {
  theme: NeonTheme;
  setTheme: (theme: NeonTheme) => void;
  config: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'crimson',
  setTheme: () => {},
  config: THEMES.crimson,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<NeonTheme>(() => {
    const saved = localStorage.getItem('trident_neon_theme') as NeonTheme;
    return saved && THEMES[saved] ? saved : 'crimson';
  });

  const setTheme = (newTheme: NeonTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('trident_neon_theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, config: THEMES[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
