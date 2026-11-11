import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Lock, CheckCircle, AlertCircle, RefreshCw, KeyRound } from "lucide-react";
import PasswordRules from "./PasswordRules";
import { MIN_LENGTH, passwordRules, passwordIsValid } from "../utils/passwordPolicy";

export default function ResetPasswordModal() {
  const { changePassword, logout } = useAuth();
  // Same rules, same wording as the invite and reset pages.
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;

    setIsSubmitting(true);
    setErrorMsg("");

    const result = await changePassword(currentPassword, newPassword);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-3xl p-8 max-w-md w-full shadow-2xl border border-border animate-in fade-in zoom-in duration-200">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-warning-soft rounded-lg border border-warning/25 flex items-center justify-center text-warning mb-4 shadow-sm">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Set Permanent Password</h2>
          <p className="text-xs text-muted-foreground mt-1">
            You logged in using a temporary password set by an Administrator. Please update your password to continue.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-danger-soft border border-danger/25 text-xs text-danger-foreground flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Current Temporary Password <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Current temporary password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring focus:outline-none"
              />
              <Lock className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              New Password <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder={`New password (min ${MIN_LENGTH} characters)`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring focus:outline-none"
              />
              <Lock className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Confirm New Password <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-ring focus:outline-none"
              />
              <Lock className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
            </div>
          </div>

          <PasswordRules rules={passwordRules(newPassword, confirmPassword)} />

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !currentPassword || !passwordIsValid(newPassword, confirmPassword)}
              className="w-full py-2.5 bg-primary hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-soft flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Update Password & Enter Dashboard
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2 text-xs font-medium text-muted-foreground hover:text-muted-foreground transition-colors"
            >
              Log out instead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
