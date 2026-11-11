/**
 * @file Sidebar.js
 * Collapsible sidebar. Close control only while open; click the logo to reopen.
 */

import React, { memo } from "react";
import { NavLink } from "react-router-dom";
import {
  Users,
  Users2,
  ScrollText,
  KeyRound,
  Moon,
  Sun,
  PanelLeftClose,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useSidebar } from "../context/SidebarContext";
import { Button } from "./ui/button";

export const SECTIONS = [
  { to: "/people", label: "People", Icon: Users, roles: ["ADMIN"] },
  { to: "/teams", label: "Teams", Icon: Users2, roles: ["ADMIN"] },
  { to: "/audit", label: "Audit log", Icon: ScrollText, roles: ["ADMIN"] },
  { to: "/access", label: "Access", Icon: KeyRound, roles: ["LEAD", "USER"] },
  { to: "/team", label: "Team", Icon: Users2, roles: ["LEAD", "USER"] },
];

export function sectionsFor(role) {
  return SECTIONS.filter((section) => section.roles.includes(role));
}

function Sidebar({ sections }) {
  const { isDark, cycleTheme } = useTheme();
  const { open, setOpen, toggle } = useSidebar();

  return (
    <aside
      aria-label="Workspace"
      data-open={open ? "true" : "false"}
      className="ui-sidebar relative z-20 flex flex-col flex-shrink-0 h-auto md:h-full bg-sidebar text-sidebar-foreground border-b md:border-b-0 md:border-r border-sidebar-border overflow-hidden"
    >
      <div
        className={`flex items-center h-[72px] ${
          open ? "px-4 justify-between gap-2" : "px-0 justify-center"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            if (!open) setOpen(true);
          }}
          aria-label={open ? "Cerberus" : "Open sidebar"}
          title={open ? "Cerberus" : "Open sidebar"}
          className={`flex items-center min-w-0 bg-transparent border-0 p-0 text-left ${
            open ? "gap-3 cursor-default" : "justify-center cursor-pointer"
          }`}
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#f6f9fc] to-[#c5d4e4] text-[#0a2540] flex items-center justify-center text-[13px] font-bold tracking-tight shadow-[0_8px_20px_rgb(0_0_0/0.28)] flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.04] active:scale-[0.98]">
            C
            <span className="absolute -right-0.5 -bottom-0.5 w-2 h-2 rounded-full bg-[#0d9488] ring-[2.5px] ring-sidebar" />
          </div>
          <div className="ui-sidebar-label min-w-0 leading-tight">
            <div className="text-[14px] font-semibold tracking-[-0.03em] text-sidebar-accent-foreground">
              Cerberus
            </div>
            <div className="text-[11px] text-sidebar-foreground/55">Access console</div>
          </div>
        </button>

        {open && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={toggle}
            aria-label="Close sidebar"
            title="Close sidebar"
            className="hidden md:inline-flex text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-white/5"
          >
            <PanelLeftClose className="size-4" />
          </Button>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto scroll-soft pb-3 ${open ? "px-3" : "px-2.5"}`}>
        <p className="ui-sidebar-meta px-2.5 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/40">
          Workspace
        </p>
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {sections.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) =>
                `group relative flex items-center min-h-[42px] rounded-[12px] no-underline text-[13px] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] flex-shrink-0 ${
                  open ? "gap-2.5 px-2.5" : "justify-center px-0"
                } ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-[inset_0_0_0_1px_rgb(255_255_255/0.04)]"
                    : "text-sidebar-foreground hover:bg-white/[0.04] hover:text-sidebar-accent-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-full bg-[#fafaf9]" />
                  )}
                  <Icon className="w-[18px] h-[18px] opacity-85 flex-shrink-0" strokeWidth={1.7} />
                  <span className="ui-sidebar-label">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className={`hidden md:flex flex-col gap-1 border-t border-sidebar-border ${open ? "p-3" : "p-2.5"}`}>
        <Button
          type="button"
          variant="ghost"
          className={`text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-white/5 ${
            open ? "w-full justify-start" : "w-full justify-center px-0"
          }`}
          onClick={cycleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="ui-sidebar-label">{isDark ? "Light mode" : "Dark mode"}</span>
        </Button>
      </div>
    </aside>
  );
}

export default memo(Sidebar);
