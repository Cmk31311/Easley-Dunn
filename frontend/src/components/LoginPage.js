import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Mail, Lock, Eye, EyeOff, AlertCircle, RefreshCw, MailCheck, ArrowLeft, Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function Notice({ tone = "danger", title, children }) {
  const tones = {
    danger: "bg-danger-soft border-danger/20 text-danger-foreground",
    warning: "bg-warning-soft border-warning/20 text-warning-foreground",
    info: "bg-info-soft border-info/20 text-info-foreground",
  };
  const Icon = tone === "info" ? MailCheck : AlertCircle;
  return (
    <div className={`mb-5 rounded-xl border p-3.5 ${tones[tone]}`}>
      <div className="flex gap-3">
        <Icon className="size-[18px] flex-shrink-0 mt-0.5" />
        <div>
          {title && <h3 className="m-0 text-sm font-semibold tracking-tight font-sans">{title}</h3>}
          <div className={`text-sm leading-relaxed ${title ? "mt-1" : ""}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login, error, setError, sessionExpired } = useAuth();
  const { isDark, cycleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [sent, setSent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    setError(null);
    await login(email, password);
    setIsSubmitting(false);
  };

  const requestReset = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not send a reset link.");
      setSent(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const backToSignIn = () => {
    setForgot(false);
    setSent("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex justify-end p-4">
        <Button type="button" variant="ghost" size="icon" onClick={cycleTheme} aria-label="Toggle theme">
          {isDark ? <Sun /> : <Moon />}
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 pb-16">
        <div className="w-full max-w-[400px] ui-fade-in">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold font-sans shadow-soft">
              C
            </div>
            <h1 className="m-0 text-[32px] font-semibold text-foreground">
              {forgot ? "Reset password" : "Sign in"}
            </h1>
            <p className="mt-2 mb-0 ui-meta font-sans">
              {forgot
                ? "Enter your email and we will send a one-hour reset link."
                : "Use your lab account to open Cerberus."}
            </p>
          </div>

          <div className="ui-panel p-6 sm:p-7">
            {sessionExpired && !error && (
              <Notice tone="warning" title="Session expired">
                You were signed out for security. Sign in again to continue.
              </Notice>
            )}
            {error && (
              <Notice tone="danger" title="Could not sign in">
                {error}
              </Notice>
            )}

            {sent ? (
              <div className="space-y-4">
                <Notice tone="info">{sent}</Notice>
                <Button type="button" variant="outline" className="w-full" onClick={backToSignIn}>
                  <ArrowLeft /> Back to sign in
                </Button>
              </div>
            ) : (
              <form onSubmit={forgot ? requestReset : handleSubmit} className="space-y-4 font-sans">
                <div>
                  <label className="ui-label" htmlFor="login-email">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      autoFocus
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="ui-input pl-10"
                    />
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                  </div>
                </div>

                <div className={forgot ? "hidden" : ""}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="ui-label mb-0" htmlFor="login-password">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgot(true);
                        setError(null);
                      }}
                      className="text-[12px] font-semibold text-foreground/70 hover:text-foreground cursor-pointer bg-transparent border-0 p-0"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      required={!forgot}
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="ui-input pl-10 pr-10"
                    />
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground bg-transparent border-0 p-0 cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting || !email || (!forgot && !password)}
                >
                  {isSubmitting ? <RefreshCw className="animate-spin" /> : null}
                  {forgot ? "Send reset link" : "Sign in"}
                </Button>

                {forgot && (
                  <Button type="button" variant="outline" className="w-full" onClick={backToSignIn}>
                    <ArrowLeft /> Back to sign in
                  </Button>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
