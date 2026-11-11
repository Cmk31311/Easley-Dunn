/**
 * @file AuditTable.js
 * @description The audit log as a table: one row per event, newest first, the
 * detail hidden until a row is opened.
 *
 * Both the Audit page and a person's Activity tab render this, so the two can
 * never drift apart in wording or behaviour — the second is the same table with
 * the person fixed as the target.
 *
 * Rows are not numbered. The log is append-only and filtered, so "row 3" means
 * nothing the moment a new event arrives; the event id in the detail is the
 * stable handle, which is how Okta and CloudTrail do it too.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, RefreshCw, Download } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import Toasts, { useToasts } from "./Toasts";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";
const PAGE_SIZE = 50;

/**
 * The activity label: short and in the past tense, the way Okta's System Log
 * and Entra's audit log read. What it was done to lives in the Target column,
 * each object named with its type, rather than squeezed in here with arrows.
 */
export const CATEGORIES = [
  { id: "", label: "All" },
  { id: "ACCESS", label: "Access" },
  { id: "MEMBERSHIP", label: "Membership" },
  { id: "TEAMS", label: "Teams" },
  { id: "PEOPLE", label: "People" },
  { id: "AUTH", label: "Sign-ins" },
];

const ACTIVITIES = {
  SIGN_IN: "Signed in",
  SIGN_OUT: "Signed out",
  PASSWORD_CHANGED: "Changed password",
  PASSWORD_RESET_REQUESTED: "Requested password reset",
  PASSWORD_RESET: "Reset password",
  PERSON_ADDED: "Added user",
  INVITE_SENT: "Sent invite",
  INVITE_ACCEPTED: "Accepted invite",
  TEAM_CREATED: "Created team",
  TEAM_UPDATED: "Updated team",
  TEAM_ARCHIVED: "Archived team",
  MEMBER_ADDED: "Added member to team",
  MEMBER_REMOVED: "Removed member from team",
  LEAD_SET: "Set team lead",
  LEAD_UNSET: "Removed team lead",
  ROLE_CHANGED: "Changed role",
  SERVICE_GRANTED: "Granted service access",
  SERVICE_REVOKED: "Revoked service access",
};

function activityFor(action) {
  return ACTIVITIES[action] || action.toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

/** The objects an event acted on, each with its type. */
function targetsOf(e, includePerson = true) {
  const targets = [];
  if (e.target && includePerson) targets.push({ kind: "user", name: e.target.name, to: `/people/${e.target.userId}` });
  if (e.team) targets.push({ kind: "team", name: e.team.name, to: `/teams/${e.team.teamId}` });
  if (e.service) targets.push({ kind: "service", name: e.service.name });
  return targets;
}

/**
 * What we noted alongside the event. Only what adds something: a flag that is
 * false, or anything the Activity and Target columns already said, is left out.
 */
const DETAIL_LABELS = {
  reason: "Reason",
  from: "Role before",
  to: "Role after",
  wasLead: "Was a lead of this team",
  isLead: "Added as a lead",
  membersRemoved: "Members removed",
  status: "Error code",
  ip: "From address",
  userAgent: "Browser",
  email: "Email tried",
  performedBy: "Done by",
  userId: "User id (not found)",
  teamId: "Team id (not found)",
};

const SKIP_WHEN_FALSE = new Set(["wasLead", "isLead"]);

function detailRows(detail) {
  const rows = [];
  Object.entries(detail || {}).forEach(([key, value]) => {
    if (key === "before" || key === "after") return;
    // The team name is already the Target; repeating it says nothing.
    if (key === "name") return;
    if (typeof value === "boolean" && (!value || SKIP_WHEN_FALSE.has(key)) && !value) return;
    rows.push([DETAIL_LABELS[key] || key, typeof value === "boolean" ? "Yes" : String(value)]);
  });
  if (detail?.before && detail?.after) {
    [["name", "Name"], ["description", "Description"]].forEach(([field, label]) => {
      if (detail.before[field] !== detail.after[field]) {
        rows.push([`${label} changed`, `${detail.before[field] || "—"} → ${detail.after[field] || "—"}`]);
      }
    });
  }
  return rows;
}

/** Relative time for the column; the exact timestamp is on hover and in the detail. */
function when(iso) {
  const date = new Date(iso);
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return date.toLocaleDateString();
}


export { activityFor };

/**
 * @param {Object} props
 * @param {Object} props.filters      query parameters for /audit
 * @param {boolean} [props.showTarget] false on a person's own activity: only
 *                                     the person is dropped from Target, since
 *                                     "Revoked service access" says nothing
 *                                     without the service beside it
 * @param {boolean} [props.exportable] show the CSV button
 * @param {string} [props.emptyText]
 */
export default function AuditTable({
  filters,
  showTarget = true,
  exportable = false,
  categories = false,
  emptyText = "Nothing recorded in this period.",
}) {
  const [category, setCategory] = useState("");
  const [events, setEvents] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [open, setOpen] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { toasts, push, dismiss } = useToasts();

  const query = new URLSearchParams({
    limit: String(PAGE_SIZE),
    ...filters,
    ...(category ? { category } : {}),
  }).toString();

  const load = useCallback(async (before) => {
    const p = new URLSearchParams(query);
    if (before) p.set("before", before);
    try {
      const res = await fetchWithAuth(`${API_URL}/audit?${p}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || `Could not load the log (${res.status}).`);
      setEvents((prev) => (before ? [...prev, ...json.data] : json.data));
      setCursor(json.nextCursor);
    } catch (err) {
      push("error", err.message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [query, push]);

  useEffect(() => {
    setIsLoading(true);
    setOpen(null);
    load();
  }, [load]);

  const exportCsv = () => {
    const header = ["Time", "Actor", "Activity", "User", "Team", "Service", "Result", "Detail"];
    const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const body = events.map((e) =>
      [
        new Date(e.createdAt).toISOString(),
        e.actor?.name || e.detail?.performedBy || "System",
        activityFor(e.action),
        e.target?.name || "",
        e.team?.name || "",
        e.service?.name || "",
        e.outcome === "SUCCESS" ? "Success" : "Failed",
        JSON.stringify(e.detail || {}),
      ].map(cell).join(",")
    );
    const blob = new Blob([[header.map(cell).join(","), ...body].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {(categories || exportable) && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {categories &&
            CATEGORIES.map((c) => (
              <button
                key={c.id || "all"}
                type="button"
                role="tab"
                aria-selected={category === c.id}
                onClick={() => setCategory(c.id)}
                className={`h-8 px-2.5 rounded-full text-[12px] font-semibold cursor-pointer border transition-colors ${
                  category === c.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                }`}
              >
                {c.label}
              </button>
            ))}
          {exportable && (
            <button
              type="button"
              onClick={exportCsv}
              disabled={!events.length}
              className="ml-auto flex items-center gap-1.5 h-8 px-2.5 border border-border rounded-xl bg-card text-[12px] font-semibold disabled:opacity-50 cursor-pointer hover:bg-muted"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          )}
        </div>
      )}

      <div className="ui-panel overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="bg-muted/50 border-b border-border text-[11px] uppercase font-semibold tracking-wide text-muted-foreground">
              <th className="py-2.5 px-3 w-8" />
              <th className="py-2.5 px-2">Time</th>
              <th className="py-2.5 px-3">Actor</th>
              <th className="py-2.5 px-3">Activity</th>
              <th className="py-2.5 px-3">Target</th>
              <th className="py-2.5 px-3">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan="6" className="py-10 text-center text-muted-foreground">Loading the log…</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan="6" className="py-10 text-center text-muted-foreground">{emptyText}</td></tr>
            ) : (
              events.map((e) => {
                const isOpen = open === e.eventId;
                const failed = e.outcome !== "SUCCESS";
                return (
                  <React.Fragment key={e.eventId}>
                    <tr
                      className="hover:bg-muted/40 cursor-pointer transition-colors"
                      onClick={() => setOpen(isOpen ? null : e.eventId)}
                    >
                      <td className="py-2 px-3">
                        <span className="w-6 h-6 inline-flex items-center justify-center rounded text-muted-foreground">
                          <ChevronRight className={`w-4 h-4 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? "rotate-90" : ""}`} />
                        </span>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground whitespace-nowrap tabular-nums" title={new Date(e.createdAt).toLocaleString()}>
                        {when(e.createdAt)}
                      </td>
                      <td className="py-2 px-3">
                        {e.actor ? (
                          <Link
                            to={`/people/${e.actor.userId}`}
                            onClick={(ev) => ev.stopPropagation()}
                            className="text-foreground no-underline hover:underline"
                          >
                            {e.actor.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">{e.detail?.performedBy || "System"}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-medium text-foreground">{activityFor(e.action)}</td>
                      <td className="py-2 px-3">
                        {targetsOf(e, showTarget).map((t) => (
                          <div key={`${t.kind}-${t.name}`} className="leading-snug">
                            {t.to ? (
                              <Link
                                to={t.to}
                                onClick={(ev) => ev.stopPropagation()}
                                className="text-foreground no-underline hover:underline"
                              >
                                {t.name}
                              </Link>
                            ) : (
                              <span className="text-foreground">{t.name}</span>
                            )}
                            <span className="text-muted-foreground"> ({t.kind})</span>
                          </div>
                        ))}
                        {!targetsOf(e, showTarget).length && <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`font-semibold ${failed ? "text-danger-foreground" : "text-success-foreground"}`}>
                          {failed ? "Failed" : "Success"}
                        </span>
                        {failed && e.detail?.reason && (
                          <span className="block text-xs text-muted-foreground max-w-[280px] truncate" title={e.detail.reason}>
                            {e.detail.reason}
                          </span>
                        )}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-muted/30">
                        <td />
                        <td colSpan="5" className="py-3.5 pr-4">
                          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
                            <div>
                              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Timestamp</dt>
                              <dd className="m-0">{new Date(e.createdAt).toLocaleString()}</dd>
                            </div>
                            <div>
                              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Event</dt>
                              <dd className="m-0 font-mono text-xs">{e.action}</dd>
                            </div>
                            <div>
                              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Actor</dt>
                              <dd className="m-0">{e.actor?.name || e.detail?.performedBy || "System"}</dd>
                            </div>
                            <div>
                              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Affected user</dt>
                              <dd className="m-0">{e.target?.name || "—"}</dd>
                            </div>
                            <div>
                              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Team</dt>
                              <dd className="m-0">{e.team?.name || "—"}</dd>
                            </div>
                            <div>
                              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Service</dt>
                              <dd className="m-0">{e.service?.name || "—"}</dd>
                            </div>
                            <div>
                              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Event id</dt>
                              <dd className="m-0 font-mono text-xs">{e.eventId}</dd>
                            </div>
                          </dl>
                          {detailRows(e.detail).length > 0 && (
                            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-[13px]">
                              {detailRows(e.detail).map(([label, value]) => (
                                <div key={label}>
                                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
                                  <dd className="m-0 break-words">{value}</dd>
                                </div>
                              ))}
                            </dl>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>

        {cursor && (
          <div className="p-2.5 border-t border-border text-center">
            <button
              type="button"
              disabled={isLoadingMore}
              onClick={() => { setIsLoadingMore(true); load(cursor); }}
              className="inline-flex items-center gap-2 h-8 px-3 border border-border rounded-md bg-card text-[13px] font-medium disabled:opacity-50 cursor-pointer hover:bg-background"
            >
              {isLoadingMore && <RefreshCw className="w-4 h-4 animate-spin" />}
              Load more
            </button>
          </div>
        )}
      </div>


      {!isLoading && events.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Showing {events.length} {events.length === 1 ? "event" : "events"}
          {cursor ? " — load more for earlier ones." : ", the oldest in this period."}
        </p>
      )}

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
