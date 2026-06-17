"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Sparkles,
  Trash2,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EMAIL_TEMPLATES, type EmailTemplate } from "@/lib/email-templates";

interface ScheduledEmail {
  id: string;
  name: string;
  recipient: string;
  subject: string;
  template: string;
  cronExpr: string;
  ticker: string | null;
  portfolioJson: string | null;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EmailLog {
  id: string;
  scheduledEmailId: string | null;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  error: string | null;
  sentAt: string;
}

export function Automation() {
  // Compose & send now
  const [template, setTemplate] = useState<EmailTemplate>("morning-brief");
  const [recipient, setRecipient] = useState("");
  const [ticker, setTicker] = useState("");
  const [portfolioJson, setPortfolioJson] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<{ subject: string; body: string; stubMode: boolean } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Scheduled
  const [scheduled, setScheduled] = useState<ScheduledEmail[]>([]);
  const [loadingSched, setLoadingSched] = useState(true);

  // New schedule form
  const [newName, setNewName] = useState("");
  const [newRecipient, setNewRecipient] = useState("");
  const [newTemplate, setNewTemplate] = useState<EmailTemplate>("morning-brief");
  const [newCron, setNewCron] = useState("0 8 * * *");
  const [newTicker, setNewTicker] = useState("");
  const [creating, setCreating] = useState(false);

  // Logs
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const refreshScheduled = useCallback(async () => {
    setLoadingSched(true);
    try {
      const r = await fetch("/api/email/scheduled", { cache: "no-store" });
      const d = await r.json();
      setScheduled(d.scheduledEmails ?? []);
    } catch {
      toast.error("Failed to load scheduled emails");
    } finally {
      setLoadingSched(false);
    }
  }, []);

  const refreshLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const r = await fetch("/api/email/logs?limit=20", { cache: "no-store" });
      const d = await r.json();
      setLogs(d.logs ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    refreshScheduled();
    refreshLogs();
  }, [refreshScheduled, refreshLogs]);

  async function handleGeneratePreview() {
    if (!recipient.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      toast.error("Enter a valid recipient email first");
      return;
    }
    setGenerating(true);
    setPreview(null);
    setPreviewOpen(true);
    try {
      const r = await fetch("/api/email/send-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          recipient,
          ticker: ticker || undefined,
          portfolioJson: portfolioJson || undefined,
          preview: true,
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `Failed (${r.status})`);
      }
      const d = await r.json();
      setPreview({ subject: d.subject, body: d.body, stubMode: !!d.stubMode });
      toast.success("Preview generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSendNow() {
    if (!recipient.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      toast.error("Enter a valid recipient email first");
      return;
    }
    setSending(true);
    try {
      const r = await fetch("/api/email/send-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          recipient,
          ticker: ticker || undefined,
          portfolioJson: portfolioJson || undefined,
          preview: false,
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `Failed (${r.status})`);
      }
      const d = await r.json();
      setPreview({ subject: d.subject, body: d.body, stubMode: !!d.stubMode });
      setPreviewOpen(true);
      toast.success(
        d.stub
          ? "Email generated + stub-logged to /download/email-log.txt (no SMTP configured)"
          : "Email sent!"
      );
      await refreshLogs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  async function handleCreateSchedule() {
    if (!newName.trim()) return toast.error("Name is required");
    if (!newRecipient.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newRecipient))
      return toast.error("Valid recipient email is required");
    if (!newCron.trim()) return toast.error("Cron expression is required");
    setCreating(true);
    try {
      const r = await fetch("/api/email/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          recipient: newRecipient,
          template: newTemplate,
          cronExpr: newCron,
          ticker: newTicker || undefined,
          enabled: true,
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `Failed (${r.status})`);
      }
      toast.success("Schedule created");
      setNewName("");
      setNewRecipient("");
      setNewTicker("");
      setNewCron("0 8 * * *");
      await refreshScheduled();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  async function toggleScheduled(s: ScheduledEmail) {
    try {
      const r = await fetch(`/api/email/scheduled/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !s.enabled }),
      });
      if (!r.ok) throw new Error(`Failed (${r.status})`);
      await refreshScheduled();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function deleteScheduled(id: string) {
    if (!confirm("Delete this scheduled email?")) return;
    try {
      await fetch(`/api/email/scheduled/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      await refreshScheduled();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="border-slate-700 bg-slate-800/60 card-glow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base text-slate-50">Email Automation</CardTitle>
              <CardDescription className="text-xs text-amber-400/90">
                AI brain performs research and sends emails on schedule · cron-based · stub-logged when no SMTP configured
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Compose & Send Now */}
        <Card className="border-slate-700 bg-slate-800/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-50 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Compose &amp; Send Now
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Generate a one-off AI research email. Preview before sending.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Template">
                <Select value={template} onValueChange={(v) => setTemplate(v as EmailTemplate)}>
                  <SelectTrigger className="bg-slate-900/70 border-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMAIL_TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Recipient email">
                <Input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-slate-900/70 border-slate-700 text-slate-100"
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Ticker (optional — used by signal-alert / dcf-deepdive)">
                <Input
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="AAPL"
                  className="bg-slate-900/70 border-slate-700 font-mono text-slate-100"
                />
              </Field>
              <Field label="Portfolio JSON (optional — used by portfolio-review)">
                <Input
                  value={portfolioJson}
                  onChange={(e) => setPortfolioJson(e.target.value)}
                  placeholder='{"VTI":60,"VXUS":25,"BND":10,"cash":5}'
                  className="bg-slate-900/70 border-slate-700 font-mono text-xs text-slate-100"
                />
              </Field>
            </div>

            <div className="rounded-md border border-slate-700/60 bg-slate-900/40 p-2 text-[11px] text-slate-400">
              {EMAIL_TEMPLATES.find((t) => t.id === template)?.description}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                onClick={handleGeneratePreview}
                disabled={generating || sending}
                variant="outline"
                className="border-slate-700 bg-slate-900/40 hover:border-amber-500/60 hover:text-amber-300"
              >
                {generating ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="mr-1.5 h-4 w-4" />
                )}
                Generate Preview
              </Button>
              <Button
                onClick={handleSendNow}
                disabled={generating || sending}
                className="bg-amber-500 text-slate-950 hover:bg-amber-400"
              >
                {sending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-4 w-4" />
                )}
                Send Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview panel */}
        <Card className="border-slate-700 bg-slate-800/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base text-slate-50 flex items-center gap-2">
                <Eye className="h-4 w-4 text-cyan-400" />
                Preview
              </CardTitle>
              {preview?.stubMode && (
                <Badge variant="outline" className="border-amber-700/60 bg-amber-900/20 text-amber-300 text-[10px]">
                  Stub mode (no SMTP)
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-slate-400">
              {preview ? preview.subject : "Generate a preview to see the rendered email body"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!preview ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-700 rounded-md">
                {generating ? "Generating…" : "No preview yet"}
              </div>
            ) : (
              <iframe
                title="Email preview"
                srcDoc={preview.body}
                className="w-full h-96 rounded-md border border-slate-700 bg-white"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scheduled emails */}
      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-50 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            Scheduled Emails ({scheduled.length})
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Cron-based recurring research emails · scheduler checks every minute
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingSched ? (
            <div className="text-xs text-slate-500">Loading…</div>
          ) : scheduled.length === 0 ? (
            <div className="text-xs text-slate-500 py-4 text-center border border-dashed border-slate-700 rounded-md">
              No scheduled emails yet — create one below
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-900/60 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Template</th>
                    <th className="px-3 py-2 text-left">Recipient</th>
                    <th className="px-3 py-2 text-left">Cron</th>
                    <th className="px-3 py-2 text-left">Next run</th>
                    <th className="px-3 py-2 text-left">Last status</th>
                    <th className="px-3 py-2 text-center">Enabled</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {scheduled.map((s) => (
                    <tr key={s.id} className="border-t border-slate-700/50">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-200">{s.name}</div>
                        {s.ticker && (
                          <div className="text-[10px] text-amber-400 font-mono">${s.ticker}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-300">{s.template}</td>
                      <td className="px-3 py-2 text-slate-300 font-mono text-[10px]">{s.recipient}</td>
                      <td className="px-3 py-2 text-slate-300 font-mono">{s.cronExpr}</td>
                      <td className="px-3 py-2 text-slate-400">
                        {s.nextRunAt ? new Date(s.nextRunAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={s.lastStatus} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Switch checked={s.enabled} onCheckedChange={() => toggleScheduled(s)} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => deleteScheduled(s.id)}
                          className="text-slate-500 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Create form */}
          <div className="border-t border-slate-700/60 pt-3">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
              <Plus className="h-3 w-3" /> Create new schedule
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Schedule name"
                className="h-8 bg-slate-900/70 border-slate-700 text-xs text-slate-100"
              />
              <Input
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="recipient@example.com"
                className="h-8 bg-slate-900/70 border-slate-700 text-xs text-slate-100"
              />
              <Select value={newTemplate} onValueChange={(v) => setNewTemplate(v as EmailTemplate)}>
                <SelectTrigger className="h-8 bg-slate-900/70 border-slate-700 text-xs text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={newCron}
                onChange={(e) => setNewCron(e.target.value)}
                placeholder="0 8 * * *"
                className="h-8 bg-slate-900/70 border-slate-700 text-xs text-slate-100 font-mono"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <Input
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                placeholder="Ticker (optional)"
                className="h-8 bg-slate-900/70 border-slate-700 text-xs text-slate-100 font-mono"
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCreateSchedule}
                  disabled={creating}
                  size="sm"
                  className="bg-amber-500 text-slate-950 hover:bg-amber-400 h-8"
                >
                  {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  <span className="ml-1">Create</span>
                </Button>
                <span className="text-[10px] text-slate-500">
                  Examples: <code className="font-mono">0 8 * * *</code> (daily 8am), <code className="font-mono">0 9 * * 1</code> (Mon 9am), <code className="font-mono">*/30 * * * *</code> (every 30min)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base text-slate-50 flex items-center gap-2">
              <Mail className="h-4 w-4 text-cyan-400" />
              Recent Sends (last 20)
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshLogs}
              className="h-7 text-[10px] border-slate-700 bg-slate-900/40"
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="text-xs text-slate-500">Loading…</div>
          ) : logs.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-700 rounded-md">
              No emails sent yet
            </div>
          ) : (
            <ul className="space-y-1.5 max-h-96 overflow-y-auto aib-scroll pr-1">
              {logs.map((l) => (
                <li key={l.id} className="rounded-md border border-slate-700/60 bg-slate-900/40">
                  <button
                    onClick={() => setExpandedLogId(expandedLogId === l.id ? null : l.id)}
                    className="flex w-full items-center gap-3 p-2 text-left"
                  >
                    <StatusIcon status={l.status} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">{l.subject || "(no subject)"}</div>
                      <div className="text-[10px] text-slate-500 truncate">
                        To: {l.recipient} · {new Date(l.sentAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <StatusBadge status={l.status} />
                  </button>
                  {expandedLogId === l.id && (
                    <div className="border-t border-slate-700/60 p-2">
                      {l.error ? (
                        <pre className="text-[10px] text-rose-300 whitespace-pre-wrap">{l.error}</pre>
                      ) : (
                        <iframe
                          title={`Log ${l.id}`}
                          srcDoc={l.body}
                          className="w-full h-64 rounded border border-slate-700 bg-white"
                        />
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] uppercase tracking-wider text-slate-400">{label}</label>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-[10px] text-slate-500">—</span>;
  const map: Record<string, string> = {
    sent: "border-emerald-700/60 bg-emerald-900/30 text-emerald-300",
    "stub-logged": "border-amber-700/60 bg-amber-900/30 text-amber-300",
    failed: "border-rose-700/60 bg-rose-900/30 text-rose-300",
    error: "border-rose-700/60 bg-rose-900/30 text-rose-300",
    pending: "border-slate-700 bg-slate-900/40 text-slate-400",
    success: "border-emerald-700/60 bg-emerald-900/30 text-emerald-300",
  };
  const cls = map[status] || map.pending;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", cls)}>
      {status}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "sent" || status === "success")
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
  if (status === "stub-logged")
    return <Mail className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
  if (status === "failed" || status === "error")
    return <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />;
  return <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />;
}
