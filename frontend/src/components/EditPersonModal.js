/**
 * @file EditPersonModal.js
 * @description Change a person's name or set a new password.
 *
 * No role picker: ADMIN cannot be assigned through the API at all, and LEAD
 * comes from leading a team, so the only thing a role control here could do is
 * demote someone by accident. The person's current role is sent back unchanged.
 */

import React, { useState } from "react";
import { X, Lock, RefreshCw } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

export default function EditPersonModal({ person, teamNames, onClose, onSaved }) {
  const [name, setName] = useState(person.name || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const needsPassword = !person.hasPassword;

  const submit = async (e) => {
    e.preventDefault();
    if (needsPassword && !password.trim()) {
      setError("This account has no password yet, so one is needed before they can sign in.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetchWithAuth(`${API_URL}/admin/roles/grant`, {
        method: "POST",
        body: JSON.stringify({
          email: person.email,
          name,
          // Sent back as it is: this form never changes anyone's role.
          role: person.role,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Could not save.");
      onSaved(password ? `${name || person.email} updated. Their password was reset.` : `${name || person.email} updated.`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-start justify-center px-4 pt-24 pb-4">
      <div role="dialog" aria-modal="true" aria-label="Edit user details" className="w-full max-w-[460px] bg-card rounded-lg shadow-2xl p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="m-0 text-lg font-bold text-foreground">Edit user details</h2>
            <p className="m-0 mt-0.5 text-sm text-muted-foreground">{person.name || person.email}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 text-muted-foreground hover:text-muted-foreground rounded-lg hover:bg-background">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase text-muted-foreground">
            Full name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-[42px] px-3.5 bg-background border border-border rounded-xl text-sm font-normal normal-case text-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Teams</span>
            <p className="m-0 text-sm text-foreground/90">
              {teamNames || "Not in any team."}
              <span className="block text-xs text-muted-foreground mt-0.5">Change these from the team's page.</span>
            </p>
          </div>

          <label className="flex flex-col gap-1 text-xs font-semibold uppercase text-muted-foreground">
            {needsPassword ? "Set a password" : "Reset password (optional)"}
            <span className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={needsPassword ? "They cannot sign in until this is set" : "Leave blank to keep the current one"}
                className={`w-full min-h-[42px] pl-9 pr-3 rounded-xl text-sm font-normal normal-case text-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring ${
                  needsPassword ? "bg-warning-soft/60 border border-amber-300" : "bg-background border border-border"
                }`}
              />
            </span>
          </label>

          {error && (
            <p role="alert" className="m-0 px-3 py-2 rounded-lg bg-danger-soft text-danger-foreground text-[13px]">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1 border-t border-border">
            <button type="button" onClick={onClose} className="min-h-[40px] px-3.5 border border-border rounded-xl bg-card text-sm font-medium cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="min-h-[40px] px-4 rounded-xl bg-primary hover:opacity-90 disabled:opacity-50 text-white text-sm font-bold flex items-center gap-2 cursor-pointer"
            >
              {busy && <RefreshCw className="w-4 h-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
