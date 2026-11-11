import React, { memo } from "react";
import { Link } from "react-router-dom";
import { Mail, Users2, UserRound, ShieldCheck, History } from "lucide-react";
import { getAvatarColor, getInitials } from "../utils/helpers";

const VIEW_TABS = [
  { id: "details", label: "Details", Icon: UserRound },
  { id: "access", label: "Access", Icon: ShieldCheck },
  { id: "activity", label: "Activity", Icon: History },
];

function UserInfoCard({ selectedUser, teams = [], activeView, onViewChange }) {
  if (!selectedUser) return null;

  return (
    <section className="ui-panel overflow-hidden ui-fade-in">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div
            className={`size-12 rounded-[12px] flex items-center justify-center font-semibold text-[15px] flex-shrink-0 shadow-soft ${getAvatarColor(
              selectedUser.name
            )}`}
          >
            {getInitials(selectedUser.name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="m-0 text-[18px] font-semibold tracking-[-0.03em] text-foreground leading-tight font-sans">
                {selectedUser.name}
              </h2>
              <span
                className={`ui-pill border ${
                  selectedUser.is_active
                    ? "bg-success-soft border-success/15 text-success-foreground"
                    : "bg-danger-soft border-danger/15 text-danger-foreground"
                }`}
              >
                {selectedUser.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2 text-[13px] text-muted-foreground">
              <Mail className="size-3.5 flex-shrink-0 opacity-70" />
              <span className="truncate">{selectedUser.email}</span>
            </div>

            <div className="mt-1.5 flex items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground flex-wrap">
              <Users2 className="size-3.5 flex-shrink-0 opacity-70" />
              {teams.length === 0 ? (
                <span>Not on a team</span>
              ) : (
                teams.map((team, i) => (
                  <span key={team.team_id} className="inline-flex items-center">
                    <Link
                      to={`/teams/${team.team_id}`}
                      className="text-foreground/85 no-underline hover:underline underline-offset-2"
                    >
                      {team.name}
                    </Link>
                    {team.isLead && (
                      <span className="ml-1.5 ui-pill bg-warning-soft border border-warning/15 text-warning-foreground">
                        Lead
                      </span>
                    )}
                    {i < teams.length - 1 && <span className="text-border ml-2">·</span>}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {onViewChange && (
        <div className="px-3 pb-3">
          <div
            role="tablist"
            aria-label="Person views"
            className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-muted/80 border border-border/70"
          >
            {VIEW_TABS.map(({ id, label, Icon }) => {
              const selected = activeView === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onViewChange(id)}
                  className={`relative flex items-center justify-center gap-2 min-h-[40px] rounded-[10px] text-[13px] font-semibold border-0 cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    selected
                      ? "bg-card text-foreground shadow-soft"
                      : "bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${selected ? "opacity-100" : "opacity-70"}`} strokeWidth={1.8} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default memo(UserInfoCard);
