/**
 * Light / dark theme for the console. Preference is stored in localStorage.
 * "system" follows the OS until the user picks light or dark explicitly.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "cerberus-theme";
const ThemeContext = createContext(null);

function resolveMode(preference) {
  if (preference === "light" || preference === "dark") return preference;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function readStoredPreference() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    /* ignore */
  }
  // Default to light so the console does not open looking like a dark cave
  // just because the OS is in dark mode.
  return "light";
}

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(readStoredPreference);
  const [mode, setMode] = useState(() => resolveMode(readStoredPreference()));

  useEffect(() => {
    const next = resolveMode(preference);
    setMode(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.style.colorScheme = next;
  }, [preference]);

  useEffect(() => {
    if (preference !== "system") return undefined;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setMode(resolveMode("system"));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((value) => {
    setPreferenceState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  }, []);

  const cycleTheme = useCallback(() => {
    setPreference(mode === "dark" ? "light" : "dark");
  }, [mode, setPreference]);

  const value = useMemo(
    () => ({ preference, mode, setPreference, cycleTheme, isDark: mode === "dark" }),
    [preference, mode, setPreference, cycleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
