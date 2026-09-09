"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WhatsAppNavTabs } from "@/components/admin/whatsapp/WhatsAppNavTabs";
import {
  Sparkles,
  PlusCircle,
  Copy,
  Check,
  Send,
  Image as ImageIcon,
  Tag,
  Loader2,
  X,
  UploadCloud,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TemplateItem {
  id: string;
  name: string;
  category: "FESTIVAL" | "OFFER" | "PROMOTION" | "CUSTOM" | string;
  message: string;
  media_url: string | null;
  created_at: string;
}

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State for New Template
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTmplName, setNewTmplName] = useState("");
  const [newTmplCategory, setNewTmplCategory] = useState("FESTIVAL");
  const [newTmplMessage, setNewTmplMessage] = useState("");
  const [newTmplMediaUrl, setNewTmplMediaUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/templates");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTemplates(json.data);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!newTmplName.trim()) {
      setModalError("Please provide a template title.");
      return;
    }
    if (!newTmplMessage.trim()) {
      setModalError("Please provide message body.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/whatsapp/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTmplName,
          category: newTmplCategory,
          message: newTmplMessage,
          media_url: newTmplMediaUrl || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        setNewTmplName("");
        setNewTmplMessage("");
        setNewTmplMediaUrl("");
        fetchTemplates();
      } else {
        setModalError(json.message || "Failed to create template.");
      }
    } catch (err: any) {
      setModalError(err.message || "Network error.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTemplates =
    activeCategory === "ALL"
      ? templates
      : templates.filter((t) => t.category === activeCategory);

  const categories = [
    { id: "ALL", label: "All Templates" },
    { id: "FESTIVAL", label: "Festivals (Diwali, Pongal)" },
    { id: "OFFER", label: "Offers & Discounts" },
    { id: "PROMOTION", label: "New Launches" },
    { id: "CUSTOM", label: "Custom" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <AdminPageHeader
        title="WhatsApp Message Templates"
        description="Ready-to-use festive, promotional, and seasonal templates formatted for WhatsApp"
      >
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          size="sm"
        >
          <PlusCircle className="w-4 h-4" />
          Create Template
        </Button>
      </AdminPageHeader>

      {/* Tabs */}
      <WhatsAppNavTabs active="templates" />

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeCategory === c.id
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-sm">Loading templates...</span>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
            No templates in this category
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Create custom templates tailored for festival combos, weekend sales, or new snack launches.
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Create First Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                      t.category === "FESTIVAL"
                        ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                        : t.category === "OFFER"
                        ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                        : t.category === "PROMOTION"
                        ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {t.category}
                  </span>
                  <button
                    onClick={() => handleCopy(t.message, t.id)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
                    title="Copy message content"
                  >
                    {copiedId === t.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                  {t.name}
                </h3>

                {t.media_url && (
                  <div className="relative h-32 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
                    <img
                      src={t.media_url}
                      alt={t.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Message Body with WhatsApp Styled Box */}
                <div className="bg-[#EFEAE2] dark:bg-slate-950 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed border border-slate-200/60 dark:border-slate-800 max-h-48 overflow-y-auto">
                  {t.message}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Link
                  href={`/admin/dashboard/whatsapp/campaigns/create?templateId=${t.id}`}
                  className="flex-1"
                >
                  <Button
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-semibold"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Use in Campaign
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE NEW TEMPLATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Create Message Template
                  </h3>
                  <p className="text-xs text-slate-500">
                    Save reusable messages for quick festive and offer blasts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTmplName}
                  onChange={(e) => setNewTmplName(e.target.value)}
                  placeholder="e.g. Diwali Sweets 20% Special"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <select
                  value={newTmplCategory}
                  onChange={(e) => setNewTmplCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="FESTIVAL">Festival Special</option>
                  <option value="OFFER">Discount / Flash Sale</option>
                  <option value="PROMOTION">Product Launch</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Message Content <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewTmplMessage((m) => m + " {{customer_name}}")}
                      className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 font-mono"
                    >
                      + {"{{customer_name}}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTmplMessage((m) => m + " {{store_name}}")}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 font-mono"
                    >
                      + {"{{store_name}}"}
                    </button>
                  </div>
                </div>
                <textarea
                  rows={6}
                  required
                  value={newTmplMessage}
                  onChange={(e) => setNewTmplMessage(e.target.value)}
                  placeholder="Namaste {{customer_name}}! 🪔..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Attached Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={newTmplMediaUrl}
                  onChange={(e) => setNewTmplMediaUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    "Save Template"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
