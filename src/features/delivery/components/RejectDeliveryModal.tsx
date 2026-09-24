"use client";

import { useState } from "react";
import { XCircle, Loader2, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useRejectDelivery } from "../hooks";

interface RejectDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string | null;
  orderNumber?: string;
  customerName?: string;
  onSuccess?: () => void;
}

const PRESET_REASONS = [
  "Vehicle / Transport breakdown",
  "Order location outside delivery zone",
  "High active delivery workload / Shift ended",
  "Personal emergency / Unavailable",
  "Incorrect order package / issue",
];

export function RejectDeliveryModal({
  isOpen,
  onClose,
  shipmentId,
  orderNumber,
  customerName,
  onSuccess,
}: RejectDeliveryModalProps) {
  const [selectedReason, setSelectedReason] = useState(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [additionalNote, setAdditionalNote] = useState("");
  const rejectDelivery = useRejectDelivery();

  const isCustom = selectedReason === "Other";
  const finalReason = isCustom ? customReason.trim() : selectedReason;

  const handleClose = () => {
    setSelectedReason(PRESET_REASONS[0]);
    setCustomReason("");
    setAdditionalNote("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipmentId || !finalReason) return;

    rejectDelivery.mutate(
      {
        uuid: shipmentId,
        data: {
          reason: finalReason,
          note: additionalNote.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          handleClose();
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Confirm Delivery Rejection"
      className="max-w-md p-6 bg-white rounded-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header Alert Box */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-sm">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-600 text-white shadow-2xs">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-rose-900">Are you sure you want to reject?</p>
            <p className="text-xs text-rose-700 mt-0.5">
              {orderNumber ? `Order #${orderNumber}` : "Delivery Shipment"}
              {customerName ? ` • Customer: ${customerName}` : ""}
            </p>
          </div>
        </div>

        {/* Reason Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-700">
            Select Reason for Declining <span className="text-rose-600">*</span>
          </label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {[...PRESET_REASONS, "Other"].map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                  selectedReason === reason
                    ? "border-rose-600 bg-rose-50/60 text-rose-900 font-semibold"
                    : "border-neutral-200 hover:bg-neutral-50 text-neutral-700"
                }`}
              >
                <input
                  type="radio"
                  name="reject-reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="accent-rose-600 h-4 w-4 cursor-pointer"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          {isCustom && (
            <div className="pt-2">
              <input
                type="text"
                placeholder="Please enter specific reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs text-neutral-800 focus:border-rose-600 focus:outline-none transition-colors"
                maxLength={255}
                required
              />
            </div>
          )}
        </div>

        {/* Additional Note */}
        <div className="space-y-1.5">
          <label
            htmlFor="reject-note"
            className="block text-xs font-semibold text-neutral-700"
          >
            Additional Notes (Optional)
          </label>
          <textarea
            id="reject-note"
            rows={2}
            value={additionalNote}
            onChange={(e) => setAdditionalNote(e.target.value)}
            placeholder="Any additional details for the admin..."
            className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs text-neutral-800 focus:border-rose-600 focus:outline-none transition-colors resize-none"
            maxLength={500}
          />
        </div>

        {/* Admin Notification Callout */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>The admin team will be notified immediately to reassign this order.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={rejectDelivery.isPending}
            className="rounded-xl cursor-pointer text-xs flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={rejectDelivery.isPending || !finalReason}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs text-xs flex-1 sm:flex-initial"
          >
            {rejectDelivery.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Confirm Rejection
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
