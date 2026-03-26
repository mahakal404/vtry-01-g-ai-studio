import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { UserTheme, DEFAULT_THEME } from '../types';
import { Palette, Sliders, Moon, Sun, RotateCcw, Save, Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const THEME_PRESETS: { name: string; theme: UserTheme }[] = [
  {
    name: 'Dark Purple',
    theme: DEFAULT_THEME,
  },
  {
    name: 'Light Purple',
    theme: {
      ...DEFAULT_THEME,
      background: '#f5f3ff',
      card: '#ffffff',
      text: '#1e1b4b',
      muted: '#6366f1',
      border: '#e0e7ff',
      isDarkMode: false,
    },
  },
  {
    name: 'Red on White',
    theme: {
      ...DEFAULT_THEME,
      primary: '#ef4444',
      background: '#ffffff',
      card: '#fef2f2',
      text: '#7f1d1d',
      muted: '#b91c1c',
      border: '#fee2e2',
      isDarkMode: false,
    },
  },
  {
    name: 'Dark Red on Black',
    theme: {
      ...DEFAULT_THEME,
      primary: '#ef4444',
      background: '#0a0a0a',
      card: '#1a1a1a',
      text: '#fafafa',
      muted: '#7f1d1d',
      border: '#262626',
      isDarkMode: true,
    },
  },
  {
    name: 'Blue on White',
    theme: {
      ...DEFAULT_THEME,
      primary: '#3b82f6',
      background: '#f8fafc',
      card: '#ffffff',
      text: '#0f172a',
      muted: '#64748b',
      border: '#e2e8f0',
      isDarkMode: false,
    },
  },
  {
    name: 'Black on White',
    theme: {
      ...DEFAULT_THEME,
      primary: '#000000',
      background: '#ffffff',
      card: '#f9fafb',
      text: '#111827',
      muted: '#6b7280',
      border: '#e5e7eb',
      isDarkMode: false,
    },
  },
];

export default function SettingsPage() {
  const { theme, setTheme, resetTheme, saveTheme } = useTheme();
  const [localTheme, setLocalTheme] = useState<UserTheme>(theme);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  const handlePresetSelect = (preset: UserTheme) => {
    setLocalTheme(preset);
    setTheme(preset);
  };

  const handleColorChange = (key: keyof UserTheme, value: string | boolean) => {
    const updated = { ...localTheme, [key]: value };
    setLocalTheme(updated);
    setTheme(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await saveTheme(localTheme);
    setIsSaving(false);
    alert('Theme settings saved successfully!');
  };

  return (
    <div className="space-y-12 pb-10">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tighter text-text">Settings</h1>
        <p className="text-muted font-medium">Customize your V-Try experience.</p>
      </div>

      {/* Theme Presets */}
      <section className="bg-card border border-border rounded-[40px] p-8 space-y-8 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Palette size={24} />
          </div>
          <h2 className="text-2xl font-black text-text">Theme Presets</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset.theme)}
              className={`relative p-6 rounded-3xl border-2 transition-all text-left space-y-4 group ${
                localTheme.background === preset.theme.background && localTheme.primary === preset.theme.primary
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                  : 'border-border bg-background hover:border-primary/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div 
                  className="w-12 h-12 rounded-full border-4 border-white/10 shadow-lg"
                  style={{ backgroundColor: preset.theme.primary }}
                />
                {localTheme.background === preset.theme.background && localTheme.primary === preset.theme.primary && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white">
                    <Check size={14} />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="font-bold text-text">{preset.name}</p>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.theme.background }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.theme.card }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.theme.text }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Advanced Customization */}
      <section className="bg-card border border-border rounded-[40px] overflow-hidden shadow-xl">
        <button 
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full p-8 flex items-center justify-between hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Sliders size={24} />
            </div>
            <h2 className="text-2xl font-black text-text">Advanced Customization</h2>
          </div>
          {isAdvancedOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>

        <AnimatePresence>
          {isAdvancedOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-8 pb-8 space-y-10"
            >
              <div className="p-4 bg-background/50 border border-border rounded-2xl text-xs text-muted font-medium italic">
                Changes are previewed in real-time. Click "Save" to persist, or "Reset" to revert.
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { label: 'Primary Color', key: 'primary' },
                  { label: 'Background', key: 'background' },
                  { label: 'Card Background', key: 'card' },
                  { label: 'Text Color', key: 'text' },
                  { label: 'Muted Text', key: 'muted' },
                  { label: 'Border Color', key: 'border' },
                ].map((item) => (
                  <div key={item.key} className="space-y-3">
                    <label className="text-sm font-bold text-muted ml-1 uppercase tracking-widest">{item.label}</label>
                    <div className="flex items-center gap-3 p-3 bg-background border border-border rounded-2xl group hover:border-primary transition-all">
                      <input 
                        type="color" 
                        value={localTheme[item.key as keyof UserTheme] as string}
                        onChange={(e) => handleColorChange(item.key as keyof UserTheme, e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                      />
                      <input 
                        type="text" 
                        value={localTheme[item.key as keyof UserTheme] as string}
                        onChange={(e) => handleColorChange(item.key as keyof UserTheme, e.target.value)}
                        className="bg-transparent border-none text-text font-mono text-sm focus:outline-none flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-center justify-between p-6 bg-background border border-border rounded-3xl group hover:border-primary transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      {localTheme.isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
                    </div>
                    <div>
                      <p className="font-bold text-text">Dark Mode</p>
                      <p className="text-xs text-muted">Enable dark mode for better visibility</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleColorChange('isDarkMode', !localTheme.isDarkMode)}
                    className={`w-14 h-8 rounded-full p-1 transition-all ${localTheme.isDarkMode ? 'bg-primary' : 'bg-muted/20'}`}
                  >
                    <motion.div 
                      animate={{ x: localTheme.isDarkMode ? 24 : 0 }}
                      className="w-6 h-6 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-6 bg-background border border-border rounded-3xl group hover:border-primary transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-text">Use Gradient Background</p>
                      <p className="text-xs text-muted">Apply a gradient effect to background</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleColorChange('useGradient', !localTheme.useGradient)}
                    className={`w-14 h-8 rounded-full p-1 transition-all ${localTheme.useGradient ? 'bg-primary' : 'bg-muted/20'}`}
                  >
                    <motion.div 
                      animate={{ x: localTheme.useGradient ? 24 : 0 }}
                      className="w-6 h-6 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-muted/20 text-white font-black py-5 rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        >
          {isSaving ? <RotateCcw className="animate-spin" /> : <Save size={24} />}
          Save as Custom Theme
        </button>
        <button 
          onClick={resetTheme}
          className="flex-1 bg-background border border-border hover:border-destructive hover:text-destructive text-text font-black py-5 rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        >
          <RotateCcw size={24} />
          Reset to Default
        </button>
      </div>
    </div>
  );
}
