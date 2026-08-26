import React, { useState, useRef, useEffect } from 'react';
import { Palette, Sparkles, Check } from 'lucide-react';
import { useTheme, THEMES, NeonTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, config } = useTheme();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="btn-neon-theme-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 backdrop-blur-md text-xs font-semibold text-slate-200 transition shadow-sm hover:shadow-md group"
        title="Switch Neon Accent Color Theme"
      >
        <span
          className="w-3 h-3 rounded-full shadow-md animate-pulse"
          style={{ backgroundColor: config.accentColor, boxShadow: `0 0 10px ${config.accentColor}` }}
        />
        <span className="hidden sm:inline font-mono text-[11px]">{config.name.split(' ')[1] || config.name}</span>
        <Palette className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-xl p-2 shadow-2xl shadow-black/80 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center space-x-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Neon Color Accents</span>
            </span>
          </div>

          <div className="p-1 space-y-1 mt-1">
            {(Object.keys(THEMES) as NeonTheme[]).map((themeKey) => {
              const item = THEMES[themeKey];
              const isSelected = theme === themeKey;

              return (
                <button
                  key={themeKey}
                  onClick={() => {
                    setTheme(themeKey);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-slate-800 text-white font-bold border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20 transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: item.accentColor,
                        boxShadow: isSelected ? `0 0 12px ${item.accentColor}` : 'none',
                      }}
                    />
                    <span>{item.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
