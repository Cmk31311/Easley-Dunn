import React, { memo } from "react";
import { Checkbox } from "./ui/checkbox";
import { getServiceIcon } from "../utils/helpers";

function ServiceRow({ name, serviceCode, isSelected, onToggle, type, pendingConfirmation }) {
  const Icon = getServiceIcon(serviceCode, name);
  const selectedClasses =
    type === "offboard"
      ? "bg-danger-soft border-danger/25 text-danger-foreground"
      : "bg-info-soft border-info/25 text-info-foreground";

  return (
    <label
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md border transition-colors cursor-pointer select-none ${
        isSelected ? selectedClasses : "bg-card border-border text-foreground/90 hover:border-primary/30 hover:bg-muted/40"
      }`}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle(name)}
        className="size-4 rounded-[4px] border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground"
      />
      <Icon className={`size-4 flex-shrink-0 ${isSelected ? "opacity-90" : "text-muted-foreground"}`} />
      <span className="text-[13px] font-medium truncate">{name}</span>
      {pendingConfirmation && (
        <span className="ml-auto flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-warning-soft text-warning-foreground border border-warning/20">
          Pending
        </span>
      )}
    </label>
  );
}

export default memo(ServiceRow);
