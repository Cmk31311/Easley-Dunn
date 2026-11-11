/**
 * Cmd/Ctrl+K jump menu — pages, people, and teams.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Users2, ScrollText, KeyRound, ArrowRight } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import * as teamsApi from "../api/teams";
import { sectionsFor } from "./Sidebar";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const PAGE_ICONS = {
  "/people": Users,
  "/teams": Users2,
  "/audit": ScrollText,
  "/access": KeyRound,
  "/team": Users2,
};

function fullName(person) {
  const name = `${person.first_name || ""} ${person.last_name || ""}`.trim();
  return name || person.name || person.email;
}

export default function CommandPalette() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [teams, setTeams] = useState([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  const pages = useMemo(
    () =>
      sectionsFor(role).map((s) => ({
        id: `page-${s.to}`,
        kind: "page",
        label: s.label,
        hint: "Go to page",
        to: s.to,
        Icon: PAGE_ICONS[s.to] || ArrowRight,
      })),
    [role]
  );

  const loadIndex = useCallback(async () => {
    if (role !== "ADMIN") return;
    try {
      const [usersRes, teamList] = await Promise.all([
        fetchWithAuth(`${API_URL}/users`).then((r) => r.json()),
        teamsApi.listTeams(),
      ]);
      setPeople(usersRes.data || []);
      setTeams((teamList.data || []).filter((t) => t.is_active !== false));
    } catch {
      /* keep empty */
    }
  }, [role]);

  useEffect(() => {
    const onKey = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("cerberus:command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cerberus:command", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(0);
      return;
    }
    loadIndex();
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    return () => clearTimeout(t);
  }, [open, loadIndex]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pageHits = pages.filter((p) => !q || p.label.toLowerCase().includes(q));
    const peopleHits = people
      .filter((p) => {
        if (!q) return true;
        return fullName(p).toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q);
      })
      .slice(0, 8)
      .map((p) => ({
        id: `person-${p.user_id}`,
        kind: "person",
        label: fullName(p),
        hint: p.email,
        to: `/people/${p.user_id}`,
        Icon: Users,
      }));
    const teamHits = teams
      .filter((t) => !q || (t.name || "").toLowerCase().includes(q))
      .slice(0, 6)
      .map((t) => ({
        id: `team-${t.team_id}`,
        kind: "team",
        label: t.name,
        hint: "Team",
        to: `/teams/${t.team_id}`,
        Icon: Users2,
      }));

    if (role === "ADMIN") return [...pageHits, ...peopleHits, ...teamHits];
    return pageHits;
  }, [pages, people, teams, query, role]);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  const go = (item) => {
    if (!item) return;
    setOpen(false);
    navigate(item.to);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh] bg-black/35 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        className="w-full max-w-[560px] ui-panel overflow-hidden shadow-float ui-fade-in"
      >
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(results.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(results[active]);
              }
            }}
            placeholder="Jump to a page, person, or team…"
            className="flex-1 h-12 bg-transparent border-0 outline-none text-[14px] text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex h-6 items-center rounded-md border border-border bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
            esc
          </kbd>
        </div>

        <div className="max-h-[360px] overflow-y-auto scroll-soft py-2">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-muted-foreground m-0">No matches</p>
          ) : (
            results.map((item, idx) => {
              const Icon = item.Icon;
              const selected = idx === active;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => go(item)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border-0 cursor-pointer ${
                    selected ? "bg-accent text-accent-foreground" : "bg-transparent text-foreground"
                  }`}
                >
                  <span className="w-8 h-8 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold truncate">{item.label}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">{item.hint}</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.kind}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-border flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span className="ml-auto">⌘K / Ctrl K</span>
        </div>
      </div>
    </div>
  );
}
