import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [companyName, setCompanyName] = useState('Innoviety Enterprise');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(localStorage.getItem('selectedTheme') || 'emerald');
  const [themeMode, setThemeMode] = useState(localStorage.getItem('themeMode') || 'light');
  const [loading, setLoading] = useState(true);

  // Apply data-theme & dark mode attributes on document root
  const applyThemeToDOM = (themeName, mode) => {
    if (themeName) {
      document.documentElement.setAttribute('data-theme', themeName);
    }
    const currentMode = mode !== undefined ? mode : themeMode;
    if (currentMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    applyThemeToDOM(selectedTheme, themeMode);
  }, [selectedTheme, themeMode]);

  useEffect(() => {
    const fetchPlatformSettings = async () => {
      try {
        const res = await api.get('/platform/settings');
        if (res.data) {
          if (res.data.companyName) setCompanyName(res.data.companyName);
          if (res.data.companyLogo !== undefined) setCompanyLogo(res.data.companyLogo);
          if (res.data.selectedTheme) {
            setSelectedTheme(res.data.selectedTheme);
            localStorage.setItem('selectedTheme', res.data.selectedTheme);
          }
          if (res.data.themeMode) {
            setThemeMode(res.data.themeMode);
            localStorage.setItem('themeMode', res.data.themeMode);
          }
          applyThemeToDOM(res.data.selectedTheme || selectedTheme, res.data.themeMode || themeMode);
        }
      } catch (err) {
        console.warn('Failed to load platform settings on boot:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlatformSettings();
  }, []);

  const updateThemeSettings = (newSettings) => {
    if (newSettings.companyName !== undefined) setCompanyName(newSettings.companyName);
    if (newSettings.companyLogo !== undefined) setCompanyLogo(newSettings.companyLogo);
    
    let updatedTheme = selectedTheme;
    let updatedMode = themeMode;

    if (newSettings.selectedTheme !== undefined) {
      updatedTheme = newSettings.selectedTheme;
      setSelectedTheme(updatedTheme);
      localStorage.setItem('selectedTheme', updatedTheme);
    }
    if (newSettings.themeMode !== undefined) {
      updatedMode = newSettings.themeMode;
      setThemeMode(updatedMode);
      localStorage.setItem('themeMode', updatedMode);
    }

    applyThemeToDOM(updatedTheme, updatedMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        companyName,
        companyLogo,
        selectedTheme,
        themeMode,
        updateThemeSettings,
        loading
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
