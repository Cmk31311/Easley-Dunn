import React, { memo, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import ServiceRow from "./ServiceRow";

function AccessTabContent({
  items,
  selectedSet,
  onToggle,
  onActionClick,
  actionText,
  actionIcon: ActionIcon,
  isLoading,
  loadingText,
  emptyText,
  type,
  rowKey,
  discordStatus,
}) {
  const names = useMemo(
    () =>
      items.map((item) =>
        type === "onboard" ? item.service_name : item.service?.service_name || "Unknown Service"
      ),
    [items, type]
  );

  const allSelected = names.length > 0 && names.every((name) => selectedSet.has(name));

  const toggleAll = () => {
    if (allSelected) {
      names.forEach((name) => {
        if (selectedSet.has(name)) onToggle(name);
      });
      return;
    }
    names.forEach((name) => {
      if (!selectedSet.has(name)) onToggle(name);
    });
  };

  return (
    <div className="flex-grow flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="m-0 text-[12px] font-medium text-muted-foreground">Select permissions</p>
        {items.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="text-[12px] font-semibold text-foreground/70 hover:text-foreground bg-transparent border-0 p-0 cursor-pointer"
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
        )}
      </div>

      <div className="space-y-2 flex-1 max-h-[320px] overflow-y-auto scroll-soft pr-1 pb-2">
        {items.length > 0 ? (
          items.map((item) => {
            const id = item[rowKey];
            const name = type === "onboard" ? item.service_name : item.service?.service_name || "Unknown Service";
            const serviceCode = type === "onboard" ? item.service_code : item.service?.service_code || "";
            const isSelected = selectedSet.has(name);
            const pendingConfirmation =
              serviceCode === "DISCORD" && Boolean(discordStatus?.onboarded) && !discordStatus?.confirmed;

            return (
              <ServiceRow
                key={id}
                id={id}
                name={name}
                serviceCode={serviceCode}
                isSelected={isSelected}
                onToggle={onToggle}
                type={type}
                pendingConfirmation={pendingConfirmation}
              />
            );
          })
        ) : (
          <div className="py-10 text-center">
            <p className="m-0 text-sm text-muted-foreground">{emptyText}</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 -mx-1 px-1 pt-3 mt-auto bg-gradient-to-t from-card via-card to-transparent">
        <div className="rounded-xl border border-border bg-card/95 backdrop-blur px-3 py-2.5 flex items-center gap-3 shadow-soft">
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[12px] font-semibold text-foreground">
              {selectedSet.size} selected
            </p>
            <p className="m-0 text-[11px] text-muted-foreground truncate">
              {selectedSet.size
                ? Array.from(selectedSet).slice(0, 3).join(", ") + (selectedSet.size > 3 ? "…" : "")
                : "Choose services above to continue"}
            </p>
          </div>
          <Button
            type="button"
            variant={type === "offboard" ? "danger" : "default"}
            size="sm"
            onClick={onActionClick}
            disabled={selectedSet.size === 0 || isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <ActionIcon />}
            {isLoading ? loadingText : actionText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default memo(AccessTabContent);
