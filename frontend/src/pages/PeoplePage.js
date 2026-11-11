/**
 * @file PeoplePage.js
 * @description Everyone in the lab: a narrow list of names on the left, the
 * selected person on the right. Same shape as Teams, so nothing is a page
 * away — picking a name swaps the pane rather than navigating off somewhere.
 *
 * Inactive people sit in a collapsed group at the bottom, the way archived
 * teams do.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Search, ChevronRight, RefreshCw, Users, X } from "lucide-react";
import PersonDetail from "../components/PersonDetail";
import AddPersonModal from "../components/AddPersonModal";
import Toasts, { useToasts } from "../components/Toasts";
import Select from "../components/Select";
import { Button } from "../components/ui/button";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import * as teamsApi from "../api/teams";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function fullName(person) {
  const name = `${person.first_name || ""} ${person.last_name || ""}`.trim();
  return name || person.name || person.email;
}

export default function PeoplePage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [people, setPeople] = useState([]);
  const [teams, setTeams] = useState([]);
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL"); // ALL | NONE | <team_id>
  const [showInactive, setShowInactive] = useState(false);
  const [adding, setAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const searchRef = useRef(null);
  const { toasts, push, dismiss } = useToasts();

  const load = useCallback(async () => {
    try {
      const [usersRes, teamList, servicesRes] = await Promise.all([
        fetchWithAuth(`${API_URL}/users`).then((r) => r.json()),
        teamsApi.listTeams(),
        fetchWithAuth(`${API_URL}/services`).then((r) => r.json()),
      ]);
      setPeople(usersRes.data || []);
      setTeams(teamList.data || []);
      setServices(servicesRes.data || []);
    } catch (err) {
      push("error", err.message);
    } finally {
      setIsLoading(false);
    }
  }, [push]);

  useEffect(() => { load(); }, [load]);

  const teamsByUser = useMemo(() => {
    const map = new Map();
    teams.forEach((t) => {
      (t.members || []).forEach((m) => {
        const key = String(m.user_id);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(t.team_id);
      });
    });
    return map;
  }, [teams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter((p) => {
      const matchesSearch = !q || fullName(p).toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q);
      const inTeams = teamsByUser.get(String(p.user_id)) || [];
      const matchesTeam =
        teamFilter === "ALL" ||
        (teamFilter === "NONE" ? inTeams.length === 0 : inTeams.some((id) => String(id) === String(teamFilter)));
      return matchesSearch && matchesTeam;
    });
  }, [people, query, teamFilter, teamsByUser]);

  const selected = people.find((p) => String(p.user_id) === String(userId)) || null;
  const active = filtered.filter((p) => p.is_active !== false);
  const inactive = filtered.filter((p) => p.is_active === false);

  // Opens itself the first time you land on an inactive person, so the selected
  // one is visible — and after that the toggle wins. Deriving "open" from the
  // selection kept the group open regardless of the button, which made the
  // button dead for as long as an inactive person was selected.
  const autoOpenedFor = useRef(null);
  useEffect(() => {
    if (!userId || autoOpenedFor.current === String(userId)) return;
    if (people.some((p) => p.is_active === false && String(p.user_id) === String(userId))) {
      autoOpenedFor.current = String(userId);
      setShowInactive(true);
    }
  }, [userId, people]);

  // Land on someone so the pane is never empty on arrival.
  useEffect(() => {
    if (!userId && active.length) {
      navigate(`/people/${active[0].user_id}`, { replace: true });
    }
  }, [userId, active, navigate]);

  // Console shortcuts: `/` focuses search, ↑/↓ moves selection, Esc clears query.
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || e.target?.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === "Escape" && document.activeElement === searchRef.current) {
        setQuery("");
        searchRef.current?.blur();
        return;
      }
      if (typing || !active.length) return;
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const idx = Math.max(0, active.findIndex((p) => String(p.user_id) === String(userId)));
      const next = e.key === "ArrowDown"
        ? active[Math.min(active.length - 1, idx + 1)]
        : active[Math.max(0, idx - 1)];
      if (next) navigate(`/people/${next.user_id}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, userId, navigate]);

  const row = (p) => {
    const selected = String(p.user_id) === String(userId);
    const name = fullName(p);
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
    return (
      <button
        key={p.user_id}
        type="button"
        onClick={() => navigate(`/people/${p.user_id}`)}
        aria-current={selected}
        className={`group flex items-center gap-2.5 w-full min-h-[48px] px-2.5 rounded-[11px] text-left cursor-pointer transition-all duration-150 ${
          selected
            ? "bg-foreground text-background shadow-soft"
            : "hover:bg-muted/80"
        }`}
      >
        <span
          className={`w-8 h-8 rounded-[9px] flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
            selected ? "bg-background/15 text-background" : "bg-secondary text-secondary-foreground"
          }`}
        >
          {initials || "?"}
        </span>
        <span className="flex-1 min-w-0">
          <span className={`block truncate text-[13px] ${p.is_active === false ? "opacity-60" : "font-semibold tracking-tight"}`}>
            {name}
          </span>
          <span className={`block truncate text-[11px] ${selected ? "text-background/65" : "text-muted-foreground"}`}>
            {p.email}
          </span>
        </span>
        {String(p.Role).toUpperCase() === "ADMIN" && (
          <span
            className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
              selected ? "bg-background/15 text-background" : "bg-secondary text-secondary-foreground"
            }`}
          >
            Admin
          </span>
        )}
      </button>
    );
  };

  return (
    <main className="relative z-10 flex-1 min-h-0 overflow-y-auto scroll-soft px-6 md:px-8 py-7">
      <div className="flex flex-wrap items-start gap-6">
        <section
          aria-label="Users"
          className="flex-1 basis-[300px] max-w-[360px] min-w-0 sticky top-0 max-h-[calc(100vh-8rem)] ui-panel p-5 flex flex-col gap-4 overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="ui-section-title">Directory</h2>
              <p className="m-0 mt-0.5 text-[12px] text-muted-foreground">{active.length} active</p>
            </div>
            <Button type="button" size="sm" onClick={() => setAdding(true)}>
              <Plus /> Add
            </Button>
          </div>

          <label className="relative block">
            <span className="sr-only">Search users</span>
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search by name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="ui-input pl-9 pr-16"
            />
            <span className="absolute right-2.5 top-2.5 flex items-center gap-1">
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted border-0 bg-transparent cursor-pointer flex items-center justify-center"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-border bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
                  /
                </kbd>
              )}
            </span>
          </label>

          <Select label="Filter by team" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="w-full">
            <option value="ALL">All teams</option>
            <option value="NONE">No team</option>
            {teams.filter((t) => t.is_active).map((t) => (
              <option key={t.team_id} value={t.team_id}>{t.name}</option>
            ))}
          </Select>

          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading users…</p>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto scroll-soft -mr-1 pr-1 flex flex-col gap-0.5">
              {active.map(row)}
              {!active.length && (
                <div className="my-4 mx-1 px-3 py-8 rounded-xl bg-muted/60 text-center">
                  <Users className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
                  <p className="m-0 text-[13px] font-medium text-foreground">
                    {query || teamFilter !== "ALL" ? "No matches" : "No people yet"}
                  </p>
                  <p className="mt-1 mb-3 text-[12px] text-muted-foreground">
                    {query || teamFilter !== "ALL"
                      ? "Try another name, email, or team filter."
                      : "Invite the first person to get started."}
                  </p>
                  {(query || teamFilter !== "ALL") ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuery("");
                        setTeamFilter("ALL");
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : (
                    <Button type="button" size="sm" onClick={() => setAdding(true)}>
                      <Plus /> Add user
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {inactive.length > 0 && (
            <div className="flex-shrink-0 border-t border-border pt-2">
              <button
                type="button"
                onClick={() => setShowInactive((v) => !v)}
                aria-expanded={showInactive}
                className="flex items-center gap-1.5 w-full min-h-[36px] px-1.5 rounded-lg text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-background cursor-pointer"
              >
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showInactive ? "rotate-90" : ""}`} />
                Inactive
                <span className="font-medium normal-case tracking-normal">({inactive.length})</span>
              </button>
              {showInactive && (
                <div className="mt-1 max-h-[180px] overflow-y-auto scroll-soft flex flex-col gap-0.5">{inactive.map(row)}</div>
              )}
            </div>
          )}
        </section>

        <section aria-label="Selected user" className="flex-[999] basis-[520px] min-w-0">
          {isLoading ? (
            <div className="ui-panel px-6 py-12 text-center">
              <RefreshCw className="w-6 h-6 mx-auto text-muted-foreground animate-spin" />
            </div>
          ) : selected ? (
            <PersonDetail
              key={selected.user_id}
              person={selected}
              teams={teams}
              services={services}
              onPersonChanged={load}
            />
          ) : (
            <div className="ui-panel px-6 py-14 text-center">
              <Users className="w-6 h-6 mx-auto text-muted-foreground mb-3" />
              <p className="m-0 text-[14px] font-semibold text-foreground">
                {userId ? "User not found" : "Select someone"}
              </p>
              <p className="mt-1 mb-0 text-[13px] text-muted-foreground">
                {userId
                  ? "They may have been removed, or the link is stale."
                  : "Pick a person from the directory to view details and access."}
              </p>
            </div>
          )}
        </section>
      </div>

      <Toasts toasts={toasts} onDismiss={dismiss} />

      {adding && (
        <AddPersonModal
          teams={teams}
          onTeamsChanged={load}
          onClose={() => setAdding(false)}
          onAdded={(text, newUserId, opts = {}) => {
            push("success", text);
            load();
            if (newUserId && !opts.keepOpen) navigate(`/people/${newUserId}`);
          }}
        />
      )}
    </main>
  );
}
