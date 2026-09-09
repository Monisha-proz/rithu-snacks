"use client";

import React, { useState, useEffect } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WhatsAppNavTabs } from "@/components/admin/whatsapp/WhatsAppNavTabs";
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Eye,
  RefreshCw,
  Loader2,
  X,
  Phone,
  Search,
  Check,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CampaignSummary {
  id: string;
  name: string;
  type: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface RecipientLog {
  id: string;
  customer_name: string | null;
  phone_number: string;
  status: "QUEUED" | "SENDING" | "SENT" | "FAILED" | "SKIPPED";
  message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

interface CampaignDetailData extends CampaignSummary {
  statusBreakdown: Record<string, number>;
  recipients: RecipientLog[];
}

export default function WhatsAppReportsPage() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drilldown modal states
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [campaignDetail, setCampaignDetail] = useState<CampaignDetailData | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logStatusFilter, setLogStatusFilter] = useState("ALL");

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp/campaigns");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCampaigns(json.data);
      }
    } catch (err) {
      console.error("Failed to load campaign reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Open recipient log modal
  const openDetailModal = async (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/whatsapp/campaigns/${campaignId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setCampaignDetail(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch campaign logs:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Close modal
  const closeDetailModal = () => {
    setSelectedCampaignId(null);
    setCampaignDetail(null);
    setLogSearchQuery("");
    setLogStatusFilter("ALL");
  };

  // Aggregated Analytics
  const totalCampaigns = campaigns.length;
  const totalSent = campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0);
  const totalFailed = campaigns.reduce((acc, c) => acc + (c.failed_count || 0), 0);
  const totalProcessed = totalSent + totalFailed;
  const deliveryRate =
    totalProcessed > 0 ? ((totalSent / totalProcessed) * 100).toFixed(1) : "100.0";

  // Filtered recipient logs
  const filteredRecipients = React.useMemo(() => {
    if (!campaignDetail?.recipients) return [];
    let list = campaignDetail.recipients;

    if (logStatusFilter !== "ALL") {
      list = list.filter((r) => r.status === logStatusFilter);
    }

    if (logSearchQuery.trim()) {
      const q = logSearchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
          r.phone_number.includes(q)
      );
    }

    return list;
  }, [campaignDetail, logStatusFilter, logSearchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <AdminPageHeader
        title="WhatsApp Campaign Reports & Delivery Logs"
        description="Monitor delivery rates, recipient status, and real-time delivery telemetry"
      >
        <Button
          onClick={fetchCampaigns}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </AdminPageHeader>

      {/* Tabs */}
      <WhatsAppNavTabs active="reports" />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Campaigns
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {totalCampaigns}
          </p>
          <p className="text-xs text-slate-400 mt-1">Festival & Offer blasts</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Messages Delivered
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {totalSent.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">Directly to customer phones</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Delivery Rate
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {deliveryRate}%
          </p>
          <p className="text-xs text-slate-400 mt-1">Successful Baileys handshakes</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Failed / Skipped
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {totalFailed.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">Invalid or unreachable numbers</p>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Campaign Delivery History
          </h3>
          <span className="text-xs text-slate-400">
            Click &quot;View Logs&quot; for customer-by-customer breakdown
          </span>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="text-sm">Loading campaign performance logs...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm">
            No campaigns found. Create your first campaign to see delivery reports here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">Campaign Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Recipients</th>
                  <th className="p-4">Delivered</th>
                  <th className="p-4">Failed</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {campaigns.map((c) => {
                  const percent =
                    c.total_recipients > 0
                      ? Math.round(((c.sent_count + c.failed_count) / c.total_recipients) * 100)
                      : 0;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-4 font-semibold text-slate-900 dark:text-white">
                        {c.name}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {c.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : c.status === "RUNNING"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 animate-pulse"
                              : c.status === "PAUSED"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              : c.status === "SCHEDULED"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                        {c.total_recipients}
                      </td>
                      <td className="p-4 text-emerald-600 font-bold">
                        {c.sent_count}
                      </td>
                      <td className="p-4 text-rose-500 font-bold">
                        {c.failed_count}
                      </td>
                      <td className="p-4 text-slate-400">
                        {new Date(c.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetailModal(c.id)}
                          className="h-8 gap-1.5 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Logs
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECIPIENT LOG DRILLDOWN MODAL */}
      {selectedCampaignId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-4xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Recipient Delivery Audit Log
                </h3>
                <p className="text-xs text-slate-500">
                  {campaignDetail ? campaignDetail.name : "Loading campaign logs..."}
                </p>
              </div>
              <button
                onClick={closeDetailModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingDetail ? (
              <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <span className="text-xs">Fetching per-recipient logs...</span>
              </div>
            ) : campaignDetail ? (
              <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                {/* Stats Breakdown Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 flex-shrink-0">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 uppercase">Total</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {campaignDetail.total_recipients}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-center">
                    <p className="text-[10px] text-emerald-600 uppercase">Sent</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      {campaignDetail.statusBreakdown?.SENT || 0}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-center">
                    <p className="text-[10px] text-blue-600 uppercase">Queued</p>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                      {campaignDetail.statusBreakdown?.QUEUED || 0}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-center">
                    <p className="text-[10px] text-rose-600 uppercase">Failed</p>
                    <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
                      {campaignDetail.statusBreakdown?.FAILED || 0}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-center">
                    <p className="text-[10px] text-amber-600 uppercase">Skipped</p>
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                      {campaignDetail.statusBreakdown?.SKIPPED || 0}
                    </p>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between flex-shrink-0">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      placeholder="Search recipient or phone..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {["ALL", "SENT", "QUEUED", "FAILED"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setLogStatusFilter(st)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                          logStatusFilter === st
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipient Logs Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex-1 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">Customer Name</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Delivery Status</th>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Notes / Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {filteredRecipients.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400">
                            No recipient records match the filter.
                          </td>
                        </tr>
                      ) : (
                        filteredRecipients.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="p-3 font-medium text-slate-900 dark:text-white">
                              {r.customer_name || "Customer"}
                            </td>
                            <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                              +{r.phone_number}
                            </td>
                            <td className="p-3">
                              {r.status === "SENT" ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                                  <Check className="w-3.5 h-3.5" /> Sent
                                </span>
                              ) : r.status === "FAILED" ? (
                                <span className="inline-flex items-center gap-1 text-rose-500 font-semibold text-[11px]">
                                  <XCircle className="w-3.5 h-3.5" /> Failed
                                </span>
                              ) : r.status === "SENDING" ? (
                                <span className="inline-flex items-center gap-1 text-blue-500 font-semibold text-[11px] animate-pulse">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">
                                  {r.status}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-400 text-[11px]">
                              {r.sent_at
                                ? new Date(r.sent_at).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })
                                : "—"}
                            </td>
                            <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px]">
                              {r.error_message ? (
                                <span className="text-rose-500 truncate block max-w-xs">
                                  {r.error_message}
                                </span>
                              ) : r.message_id ? (
                                <span className="font-mono text-[10px] text-slate-400 truncate block max-w-xs">
                                  ID: {r.message_id}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div className="pt-2 flex justify-end flex-shrink-0">
              <Button size="sm" variant="outline" onClick={closeDetailModal}>
                Close Audit Log
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
