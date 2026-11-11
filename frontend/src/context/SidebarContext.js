/**
 * Sidebar open/closed state. Preference is kept in localStorage.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "cerberus-sidebar-open";
const SidebarContext = createContext(null);

function readOpen() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "0") return false;
    if (value === "1") return true;
  } catch {
    /* ignore */
  }
  return true;
}

export function SidebarProvider({ children }) {
  const [open, setOpenState] = useState(readOpen);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [open]);

  const setOpen = useCallback((value) => {
    setOpenState(Boolean(value));
  }, []);

  const toggle = useCallback(() => {
    setOpenState((prev) => !prev);
  }, []);

  const value = useMemo(() => ({ open, setOpen, toggle }), [open, setOpen, toggle]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
