/**
 * @file AppLayout.js
 * Frame for signed-in screens.
 */

import React, { useMemo } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { RefreshCw, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { SidebarProvider } from "../context/SidebarContext";
import LoginPage from "./LoginPage";
import ResetPasswordModal from "./ResetPasswordModal";
import CommandPalette from "./CommandPalette";
import Sidebar, { sectionsFor } from "./Sidebar";
import { Button } from "./ui/button";

const TITLES = {
  "/overview": ["Overview", "What needs attention today"],
  "/people": ["People", "Manage members, roles, and service access"],
  "/teams": ["Teams", "Structure, leads, and membership"],
  "/audit": ["Audit log", "A durable record of every access change"],
  "/access": ["Access", "Services you can use, and who granted them"],
  "/team": ["Team", "Your teammates and who to ask"],
};

function initials(name, email) {
  const source = (name || email || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2)).toUpperCase();
}

function TopBar({ title, subtitle }) {
  const { user, role, logout } = useAuth();
  const { isDark, cycleTheme } = useTheme();

  return (
    <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 md:px-8 min-h-[76px] py-3 border-b border-border/80 bg-card/75 backdrop-blur-xl">
      <div className="min-w-0">
        <h1 className="m-0 text-[28px] font-semibold text-foreground">{title}</h1>
        <p className="mt-1 mb-0 text-[13px] text-muted-foreground tracking-[-0.01em] font-sans">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={cycleTheme}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun /> : <Moon />}
        </Button>

        <div className="flex items-center gap-2.5 min-h-[42px] pl-1.5 pr-3 py-1 rounded-full border border-border/80 bg-card/90 shadow-soft backdrop-blur">
          <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-semibold shadow-soft">
            {initials(user?.name, user?.email)}
          </span>
          <span className="flex flex-col items-start leading-tight min-w-0 pr-1">
            <span className="text-[13px] font-semibold tracking-tight text-foreground truncate max-w-[150px]">
              {user?.name || user?.email}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-[0.1em]">{role}</span>
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="hidden md:inline-flex text-muted-foreground"
          onClick={() => window.dispatchEvent(new Event("cerberus:command"))}
          title="Jump anywhere"
        >
          <span className="text-[12px]">Search</span>
          <kbd className="ml-1 h-5 min-w-[1.4rem] inline-flex items-center justify-center rounded border border-border bg-muted px-1 text-[10px] font-semibold">
            ⌘K
          </kbd>
        </Button>

        <Button type="button" variant="outline" size="icon" onClick={logout} aria-label="Log out" title="Log out">
          <LogOut />
        </Button>
      </div>
    </header>
  );
}

export function Landing() {
  const { role } = useAuth();
  const [first] = sectionsFor(role);
  return first ? <Navigate to={first.to} replace /> : null;
}

export function RequireAdmin() {
  const { role } = useAuth();
  return role === "ADMIN" ? <Outlet /> : <Landing />;
}

function ConsoleFrame() {
  const { role, requiresPasswordChange } = useAuth();
  const { pathname } = useLocation();
  const sections = useMemo(() => sectionsFor(role), [role]);
  const [title, subtitle] =
    TITLES[`/${pathname.split("/")[1]}`] || TITLES[sections[0]?.to] || ["Cerberus", ""];

  return (
    <div className="ui-shell flex-nowrap">
      {sections.length > 0 && <Sidebar sections={sections} />}
      <div className="ui-main relative z-10 flex-1 h-full min-w-0 min-h-0 flex flex-col">
        <TopBar title={title} subtitle={subtitle} />
        {sections.length === 0 ? (
          <main className="flex-1 min-h-0 overflow-y-auto scroll-soft px-6 md:px-8 py-7">
            <div className="ui-panel px-6 py-12 text-center">
              <h2 className="ui-section-title">Your portal is not available yet</h2>
              <p className="mt-2 mb-0 ui-meta">
                Nothing is set up for your role yet. Contact the admin, or log out using the button above.
              </p>
            </div>
          </main>
        ) : (
          <Outlet />
        )}
      </div>
      <CommandPalette />
      {requiresPasswordChange && <ResetPasswordModal />}
    </div>
  );
}

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
          <p className="ui-meta">Verifying session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  return (
    <SidebarProvider>
      <ConsoleFrame />
    </SidebarProvider>
  );
}
