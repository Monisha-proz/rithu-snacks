"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WhatsAppNavTabs } from "@/components/admin/whatsapp/WhatsAppNavTabs";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Users,
  MessageSquare,
  Clock,
  Sparkles,
  Search,
  Filter,
  Image as ImageIcon,
  UploadCloud,
  X,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Info,
  Send,
  Loader2,
  Calendar,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CustomerItem {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  cleanPhone: string;
  isWhatsapp: boolean;
  orderCount: number;
  lastOrderDate: string | null;
  isRecentBuyer: boolean;
  isValidPhone: boolean;
}

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  message: string;
  media_url: string | null;
}

function CreateCampaignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("templateId");

  // Step state (1: Details, 2: Audience, 3: Message, 4: Schedule & Launch)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("FESTIVAL");
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Customer Audience states
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerFilter, setCustomerFilter] = useState("whatsapp_only");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());

  // Templates
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Scheduling states
  const [scheduleMode, setScheduleMode] = useState<"NOW" | "SCHEDULED">("NOW");
  const [scheduledDateTime, setScheduledDateTime] = useState<string>("");

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch Templates
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch("/api/admin/whatsapp/templates");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTemplates(json.data);
          if (templateIdParam) {
            const matched = json.data.find((t: TemplateItem) => t.id === templateIdParam);
            if (matched) {
              setMessage(matched.message);
              if (matched.media_url) setMediaUrl(matched.media_url);
              setSelectedTemplateId(matched.id);
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch templates:", e);
      }
    }
    loadTemplates();
  }, [templateIdParam]);

  // Fetch Customers when audience filter changes
  useEffect(() => {
    async function loadCustomers() {
      setIsLoadingCustomers(true);
      try {
        const res = await fetch(`/api/admin/whatsapp/customers?filter=${customerFilter}`);
        const json = await res.json();
        if (json.success && json.data?.customers) {
          const list: CustomerItem[] = json.data.customers;
          setCustomers(list);
          // Auto-select all by default if set is empty
          if (selectedCustomerIds.size === 0) {
            setSelectedCustomerIds(new Set(list.map((c) => c.id)));
          }
        }
      } catch (e) {
        console.error("Failed to load customers:", e);
      } finally {
        setIsLoadingCustomers(false);
      }
    }
    loadCustomers();
  }, [customerFilter]);

  // Handle template selection change
  const handleSelectTemplate = (tId: string) => {
    setSelectedTemplateId(tId);
    const tmpl = templates.find((t) => t.id === tId);
    if (tmpl) {
      setMessage(tmpl.message);
      if (tmpl.media_url) setMediaUrl(tmpl.media_url);
      if (!name) setName(tmpl.name);
    }
  };

  // Filtered customer list by search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  // Toggle single customer
  const toggleCustomer = (id: string) => {
    const next = new Set(selectedCustomerIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedCustomerIds(next);
  };

  // Select all / Deselect all
  const selectAllFiltered = () => {
    const next = new Set(selectedCustomerIds);
    filteredCustomers.forEach((c) => next.add(c.id));
    setSelectedCustomerIds(next);
  };

  const deselectAllFiltered = () => {
    const next = new Set(selectedCustomerIds);
    filteredCustomers.forEach((c) => next.delete(c.id));
    setSelectedCustomerIds(next);
  };

  // Insert variable tag into message
  const insertVariable = (variable: string) => {
    setMessage((prev) => prev + " " + variable);
  };

  // Media file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.data?.url) {
        setMediaUrl(json.data.url);
      } else {
        alert(json.message || "Failed to upload image.");
      }
    } catch (err: any) {
      alert("Image upload error: " + err.message);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Calculate estimated completion time (average ~3.5 seconds per recipient)
  const totalSelected = selectedCustomerIds.size;
  const estSeconds = totalSelected * 3.5;
  const estMinutes = Math.ceil(estSeconds / 60);

  // Submit Campaign
  const handleLaunchCampaign = async () => {
    setSubmitError(null);
    if (!name.trim()) {
      setSubmitError("Please enter a campaign name.");
      setCurrentStep(1);
      return;
    }
    if (totalSelected === 0) {
      setSubmitError("Please select at least 1 customer recipient.");
      setCurrentStep(2);
      return;
    }
    if (!message.trim()) {
      setSubmitError("Please compose a message.");
      setCurrentStep(3);
      return;
    }
    if (scheduleMode === "SCHEDULED" && !scheduledDateTime) {
      setSubmitError("Please pick a scheduled date and time.");
      return;
    }

    // Build recipient list
    const selectedCustomers = customers
      .filter((c) => selectedCustomerIds.has(c.id))
      .map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.cleanPhone || c.phone,
      }));

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        description,
        type,
        message,
        media_url: mediaUrl || null,
        scheduled_at: scheduleMode === "SCHEDULED" ? new Date(scheduledDateTime).toISOString() : null,
        recipients: selectedCustomers,
      };

      const res = await fetch("/api/admin/whatsapp/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        router.push("/admin/dashboard/whatsapp/campaigns");
      } else {
        setSubmitError(json.message || "Failed to create campaign.");
      }
    } catch (err: any) {
      setSubmitError(err.message || "Network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: "Campaign Info", icon: Sparkles },
    { num: 2, title: "Select Audience", icon: Users },
    { num: 3, title: "Compose Message", icon: MessageSquare },
    { num: 4, title: "Schedule & Launch", icon: Clock },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <AdminPageHeader
        title="Create WhatsApp Campaign"
        description="Deliver festival offers, flash sales, and product updates safely to 200–500 customers"
      >
        <Link href="/admin/dashboard/whatsapp/campaigns">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Campaigns
          </Button>
        </Link>
      </AdminPageHeader>

      {/* Tabs */}
      <WhatsAppNavTabs active="campaigns" />

      {/* Stepper Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <React.Fragment key={s.num}>
                <button
                  onClick={() => setCurrentStep(s.num)}
                  className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                    isCurrent
                      ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                      : isDone
                      ? "text-slate-700 dark:text-slate-300"
                      : "text-slate-400"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${
                      isCurrent
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                        : isDone
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs text-slate-400 font-normal">Step {s.num}</p>
                    <p className="text-sm font-medium">{s.title}</p>
                  </div>
                </button>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded transition-colors ${
                      currentStep > s.num ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {submitError && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl p-4 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* STEP 1: CAMPAIGN INFO */}
      {currentStep === 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Campaign Details</h2>
            <p className="text-sm text-slate-500">
              Give your campaign a recognizable name and category for analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Campaign Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Diwali Sweets & Mixture 20% Off"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Campaign Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="FESTIVAL">Festival Special (Diwali, Pongal, New Year)</option>
                <option value="OFFER">Special Discount / Flash Sale</option>
                <option value="PROMOTION">New Product Launch</option>
                <option value="GENERAL">General Announcement</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Internal Description / Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Sent to customers who ordered during last month's sale."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              onClick={() => {
                if (!name.trim()) {
                  setSubmitError("Please enter a campaign name.");
                  return;
                }
                setSubmitError(null);
                setCurrentStep(2);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6"
            >
              Next: Select Audience
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT AUDIENCE */}
      {currentStep === 2 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                2. Select Customer Audience
              </h2>
              <p className="text-sm text-slate-500">
                Pick verified customers from your store database. Safe anti-ban quota is 200–500 per run.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                Selected: {totalSelected} of {customers.length}
              </span>
            </div>
          </div>

          {/* Safety Notice if > 500 */}
          {totalSelected > 500 && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 flex items-center gap-3 text-amber-800 dark:text-amber-200 text-xs">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
              <span>
                <strong>Anti-Ban Warning:</strong> You have selected {totalSelected} customers. While our
                sequential queue includes 2.5s–4.5s jitter delays, sending to more than 500 recipients in a
                single run on a personal WhatsApp number carries risk. We recommend 200–500 customers per batch.
              </span>
            </div>
          )}

          {/* Audience Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "whatsapp_only", label: "WhatsApp Ready Only" },
              { id: "recent_buyers", label: "Recent Buyers (Last 30 Days)" },
              { id: "with_orders", label: "Customers With Orders" },
              { id: "all", label: "All Database Customers" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setCustomerFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  customerFilter === f.id
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search and Bulk Select */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer name or phone..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllFiltered}
                className="text-xs h-8"
              >
                Select All ({filteredCustomers.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAllFiltered}
                className="text-xs h-8 text-slate-500"
              >
                Deselect All
              </Button>
            </div>
          </div>

          {/* Customer Table List */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
            {isLoadingCustomers ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                <span className="text-xs">Loading customer contacts...</span>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No customers match the current filter or search criteria.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredCustomers.length > 0 &&
                          filteredCustomers.every((c) => selectedCustomerIds.has(c.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) selectAllFiltered();
                          else deselectAllFiltered();
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Phone Number</th>
                    <th className="p-3">Orders</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredCustomers.map((c) => {
                    const isSelected = selectedCustomerIds.has(c.id);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => toggleCustomer(c.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCustomer(c.id)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-3 font-medium text-slate-900 dark:text-white">
                          <div>{c.name}</div>
                          {c.email && (
                            <div className="text-[10px] text-slate-400">{c.email}</div>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          +{c.cleanPhone}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {c.orderCount} order{c.orderCount === 1 ? "" : "s"}
                        </td>
                        <td className="p-3">
                          {c.isRecentBuyer ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                              Recent Buyer
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Standard
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={() => {
                if (totalSelected === 0) {
                  setSubmitError("Please select at least 1 customer recipient.");
                  return;
                }
                setSubmitError(null);
                setCurrentStep(3);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6"
            >
              Next: Compose Message ({totalSelected})
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: COMPOSE MESSAGE & MEDIA */}
      {currentStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Editor Column */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                3. Compose Message & Media
              </h2>
              <p className="text-sm text-slate-500">
                Personalize with tags. Use *bold* for emphasis.
              </p>
            </div>

            {/* Quick Template Picker */}
            {templates.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Load From Saved Template (Optional)
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose a Festive or Promo Preset --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.category}] {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Variable insertion buttons */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Click to Insert Dynamic Customer Tag:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => insertVariable("{{customer_name}}")}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-medium transition-colors"
                >
                  + {"{{customer_name}}"}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable("{{store_name}}")}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium transition-colors"
                >
                  + {"{{store_name}}"}
                </button>
              </div>
            </div>

            {/* Message Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Message Content <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-slate-400">{message.length} characters</span>
              </div>
              <textarea
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Namaste {{customer_name}}! 🪔\n\nCelebrate this festive season with freshly prepared snacks from Rithu Snacks! Use coupon *FESTIVE20* for 20% OFF today.`}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Image Attachment */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                Campaign Banner / Product Image (Optional)
              </label>

              {mediaUrl ? (
                <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-800 flex items-center gap-4">
                  <img
                    src={mediaUrl}
                    alt="Banner preview"
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                      {mediaUrl}
                    </p>
                    <p className="text-[10px] text-slate-400">Attached image will be sent with text caption.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMediaUrl("")}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/40 text-center">
                    <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {isUploadingMedia ? "Uploading..." : "Upload Image File"}
                    </span>
                    <span className="text-[10px] text-slate-400">JPG, PNG up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploadingMedia}
                      className="hidden"
                    />
                  </label>
                  <div className="flex flex-col justify-center space-y-1">
                    <span className="text-[11px] text-slate-400">Or paste image URL:</span>
                    <input
                      type="text"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://example.com/banner.jpg"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={() => {
                  if (!message.trim()) {
                    setSubmitError("Please compose a message.");
                    return;
                  }
                  setSubmitError(null);
                  setCurrentStep(4);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6"
              >
                Next: Schedule & Launch
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-6 bg-[#E5DDD5] dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg">
              {/* WhatsApp Mockup Header */}
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-700 border border-emerald-400 flex items-center justify-center font-bold text-sm">
                  RS
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold truncate leading-tight">Rithu Snacks</h4>
                  <p className="text-[11px] text-emerald-200 truncate">Official Admin Account</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {/* Chat Bubble Body */}
              <div className="p-4 space-y-3 min-h-[360px] flex flex-col justify-end bg-opacity-70">
                <div className="self-center bg-white/80 dark:bg-slate-800/80 backdrop-blur px-3 py-1 rounded-full text-[10px] text-slate-600 dark:text-slate-300 font-medium shadow-sm">
                  Today
                </div>

                <div className="self-end max-w-[88%] bg-[#DCF8C6] dark:bg-emerald-950 text-slate-900 dark:text-emerald-100 rounded-2xl rounded-tr-sm p-3 shadow-md space-y-2 border border-emerald-200/50 dark:border-emerald-800/50">
                  {mediaUrl && (
                    <div className="rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-900 bg-black/5">
                      <img
                        src={mediaUrl}
                        alt="Preview"
                        className="w-full h-40 object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <p className="text-xs whitespace-pre-wrap leading-relaxed">
                    {message
                      ? message
                          .replace(/{{customer_name}}/g, "Priya")
                          .replace(/{{store_name}}/g, "Rithu Snacks")
                      : "Start typing your message to preview how customers will see it on their phones..."}
                  </p>

                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 dark:text-emerald-300">
                    <span>12:00 PM</span>
                    <span className="text-emerald-600 font-bold">✓✓</span>
                  </div>
                </div>
              </div>

              {/* Mockup Footer */}
              <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2 text-center text-[11px] text-slate-400 border-t border-slate-200 dark:border-slate-800">
                Live Customer WhatsApp Preview
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: SCHEDULE & LAUNCH */}
      {currentStep === 4 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              4. Review, Schedule & Launch
            </h2>
            <p className="text-sm text-slate-500">
              Verify your anti-ban delivery parameters and start your campaign.
            </p>
          </div>

          {/* Anti-ban Safeguard Badge Box */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Anti-Ban Delivery Safeguards Active</span>
            </div>
            <ul className="text-xs text-emerald-900 dark:text-emerald-300 space-y-1.5 list-disc list-inside">
              <li>
                <strong>Strict 1-by-1 Sequential Queue:</strong> Zero simultaneous blasting. Each message
                is delivered after the previous one finishes.
              </li>
              <li>
                <strong>Human Typing Simulation:</strong> Baileys sends a WhatsApp <em>composing</em> signal
                with a randomized <strong>2.5s – 4.5s jitter delay</strong> between contacts.
              </li>
              <li>
                <strong>Circuit Breaker:</strong> If your phone loses connection, the campaign pauses automatically
                rather than dropping messages.
              </li>
            </ul>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-400 font-medium">Selected Recipients</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {totalSelected}{" "}
                <span className="text-xs font-normal text-slate-500">contacts</span>
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-400 font-medium">Estimated Delivery Time</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                ~{estMinutes}{" "}
                <span className="text-xs font-normal text-slate-500">minutes</span>
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-400 font-medium">Cost</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ₹0.00{" "}
                <span className="text-xs font-normal text-slate-500">(100% Free Forever)</span>
              </p>
            </div>
          </div>

          {/* Schedule Options */}
          <div className="space-y-4 pt-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              When should this campaign start?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                onClick={() => setScheduleMode("NOW")}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  scheduleMode === "NOW"
                    ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <input
                  type="radio"
                  name="scheduleMode"
                  checked={scheduleMode === "NOW"}
                  onChange={() => setScheduleMode("NOW")}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Send Immediately</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Worker begins 1-by-1 safe delivery in the background right now.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setScheduleMode("SCHEDULED")}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  scheduleMode === "SCHEDULED"
                    ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <input
                  type="radio"
                  name="scheduleMode"
                  checked={scheduleMode === "SCHEDULED"}
                  onChange={() => setScheduleMode("SCHEDULED")}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Schedule for Later</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Background scheduler triggers automatically at your chosen date & time.
                  </p>
                </div>
              </label>
            </div>

            {scheduleMode === "SCHEDULED" && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Execution Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400">
                  Example: Pick 12:00 PM today. The server will start processing at 12:00 PM without requiring your browser tab to stay open.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(3)}
              className="gap-2"
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={handleLaunchCampaign}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8 py-2.5 text-sm font-semibold shadow-lg shadow-emerald-600/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Campaign...
                </>
              ) : scheduleMode === "SCHEDULED" ? (
                <>
                  <Calendar className="w-4 h-4" />
                  Schedule Campaign
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Launch Safe Campaign Now
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateCampaignPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span>Loading campaign wizard...</span>
        </div>
      }
    >
      <CreateCampaignContent />
    </Suspense>
  );
}
