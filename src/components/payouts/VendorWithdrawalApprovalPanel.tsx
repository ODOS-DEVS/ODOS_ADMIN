import { useMemo, useState } from "react";

import { updateVendorWithdrawalRequest } from "@/api/payoutsApi";
import { Button } from "@/components/ui/Button";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { SectionCard } from "@/components/ui/SectionCard";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";
import type { AdminVendorWithdrawalRequest, VendorWithdrawalStatus } from "@/types";

function nextStatusOptions(
  request: AdminVendorWithdrawalRequest,
): Array<{ label: string; value: VendorWithdrawalStatus }> {
  if (request.status === "pending") {
    return [
      { label: "Pending", value: "pending" },
      { label: "Approved", value: "approved" },
      { label: "Rejected", value: "rejected" },
    ];
  }
  if (request.status === "approved") {
    return [
      { label: "Approved", value: "approved" },
      { label: "Start Paystack payout", value: "paid" },
      { label: "Rejected", value: "rejected" },
    ];
  }
  return [{ label: request.status.replace(/_/g, " "), value: request.status }];
}

type VendorWithdrawalApprovalPanelProps = {
  request: AdminVendorWithdrawalRequest;
  onUpdated?: (request: AdminVendorWithdrawalRequest) => void;
};

export function VendorWithdrawalApprovalPanel({
  request,
  onUpdated,
}: VendorWithdrawalApprovalPanelProps) {
  const { token } = useAdminAuth();
  const { showToast } = useToast();
  const [draftStatus, setDraftStatus] = useState<VendorWithdrawalStatus>(request.status);
  const [draftAdminNote, setDraftAdminNote] = useState(request.adminNote ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const isLocked = useMemo(
    () => ["paid", "processing", "rejected", "failed"].includes(request.status),
    [request.status],
  );

  async function saveStatus(
    status: VendorWithdrawalStatus,
    options?: { adminNote?: string | null; confirmManualPayout?: boolean },
  ) {
    if (!token) {
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateVendorWithdrawalRequest(token, request.id, {
        status,
        adminNote: options?.adminNote ?? (draftAdminNote.trim() || null),
        confirmManualPayout: options?.confirmManualPayout,
      });
      setDraftStatus(updated.status);
      setDraftAdminNote(updated.adminNote ?? "");
      onUpdated?.(updated);
      showToast({
        title: "Withdrawal updated",
        description: `${updated.vendorName} is now marked ${updated.status}.`,
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Unable to update withdrawal",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SectionCard
      compact
      title="Admin decision"
      description="Approve the request, reject it, or confirm payout after the vendor has been paid."
    >
      <div className="flex flex-wrap gap-2">
        {request.status === "pending" ? (
          <>
            <Button
              variant="primary"
              isLoading={isSaving}
              onClick={() => void saveStatus("approved")}
            >
              Approve withdrawal
            </Button>
            <Button
              variant="secondary"
              isLoading={isSaving}
              onClick={() => void saveStatus("rejected")}
            >
              Reject
            </Button>
          </>
        ) : null}
        {request.status === "approved" ? (
          <>
            <Button
              variant="primary"
              isLoading={isSaving}
              onClick={() => void saveStatus("paid")}
            >
              Send via Paystack
            </Button>
            <Button
              variant="secondary"
              isLoading={isSaving}
              onClick={() =>
                void saveStatus("paid", { confirmManualPayout: true })
              }
            >
              Confirm manual payout
            </Button>
          </>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[220px,1fr]">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-textMuted">
            Status
          </label>
          <FilterSelect
            value={draftStatus}
            onChange={(event) =>
              setDraftStatus(event.target.value as VendorWithdrawalStatus)
            }
            options={nextStatusOptions(request)}
            disabled={isLocked}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-textMuted">
            Admin note
          </label>
          <textarea
            value={draftAdminNote}
            onChange={(event) => setDraftAdminNote(event.target.value)}
            rows={4}
            className="app-textarea min-h-[120px]"
            placeholder="Explain the approval, rejection, or payout decision."
            disabled={isLocked}
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          isLoading={isSaving}
          disabled={isLocked}
          onClick={() => void saveStatus(draftStatus)}
        >
          Save update
        </Button>
      </div>
    </SectionCard>
  );
}
