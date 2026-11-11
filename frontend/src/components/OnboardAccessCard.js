import React, { memo } from "react";
import { UserPlus, Loader2, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import AccessTabContent from "./AccessTabContent";

function OnboardAccessCard({
  selectedUser,
  isAccessLoading,
  onboardManualServices,
  onboardAutomateServices,
  onboardManualAccess,
  onboardAutomateAccess,
  onManualToggle,
  onAutomateToggle,
  onOnboardManualClick,
  onOnboardAutomateClick,
  isOnboarding,
}) {
  if (!selectedUser) {
    return (
      <div className="ui-panel h-full min-h-[280px] flex items-center justify-center border-dashed">
        <div className="text-center px-6 py-10">
          <UserPlus className="size-8 text-muted-foreground/50 mx-auto mb-3" />
          <p className="m-0 ui-meta">Select a user to grant access</p>
        </div>
      </div>
    );
  }

  return (
    <section className="ui-panel flex flex-col h-full overflow-hidden">
      <header className="px-5 py-4 border-b border-border flex items-start gap-3">
        <div className="w-9 h-9 rounded-md bg-success-soft text-success flex items-center justify-center flex-shrink-0">
          <UserPlus className="size-4.5 size-[18px]" />
        </div>
        <div>
          <h3 className="ui-section-title">Grant access</h3>
          <p className="m-0 mt-0.5 text-[12px] text-muted-foreground">Add services this person does not have yet</p>
        </div>
      </header>

      <div className="p-5 flex-1 flex flex-col">
        {isAccessLoading ? (
          <div className="py-16 flex justify-center items-center flex-1 text-muted-foreground">
            <Loader2 className="animate-spin size-7 text-primary" />
          </div>
        ) : !selectedUser.is_active ? (
          <div className="py-10 flex flex-col items-center justify-center text-center flex-grow">
            <div className="w-11 h-11 rounded-md bg-danger-soft text-danger flex items-center justify-center">
              <XCircle className="size-5" />
            </div>
            <h4 className="m-0 mt-4 text-[15px] font-semibold">User is inactive</h4>
            <p className="mt-1.5 mb-0 text-[13px] text-muted-foreground max-w-[220px]">
              Activate them before granting permissions.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="automate" className="w-full flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-md h-10">
              <TabsTrigger value="automate" className="rounded-md h-8 text-[13px] font-semibold data-[state=active]:bg-card data-[state=active]:shadow-soft">
                Automate
              </TabsTrigger>
              <TabsTrigger value="manual" className="rounded-md h-8 text-[13px] font-semibold data-[state=active]:bg-card data-[state=active]:shadow-soft">
                Manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-4 flex-grow flex flex-col justify-between">
              <AccessTabContent
                items={onboardManualServices}
                selectedSet={onboardManualAccess}
                onToggle={onManualToggle}
                onActionClick={onOnboardManualClick}
                actionText="Grant"
                actionIcon={UserPlus}
                actionVariant="default"
                isLoading={isOnboarding}
                loadingText="Granting..."
                emptyText="They already have every manual service."
                type="onboard"
                rowKey="service_id"
              />
            </TabsContent>

            <TabsContent value="automate" className="mt-4 flex-grow flex flex-col justify-between">
              <AccessTabContent
                items={onboardAutomateServices}
                selectedSet={onboardAutomateAccess}
                onToggle={onAutomateToggle}
                onActionClick={onOnboardAutomateClick}
                actionText="Grant"
                actionIcon={UserPlus}
                actionVariant="default"
                isLoading={isOnboarding}
                loadingText="Granting..."
                emptyText="They already have every automated service."
                type="onboard"
                rowKey="service_id"
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </section>
  );
}

export default memo(OnboardAccessCard);
