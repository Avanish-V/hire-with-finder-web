import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Mail,
  Send,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCcw,
  Download,
  Search,
  ArrowLeft,
  Trash2,
  Paperclip,
  Eye,
  FileText,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  Play,
  Ban,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  bulkEmailApi,
  type EmailCampaign,
  type EmailRecipient,
  type CsvValidationReport,
  type AttachmentItem,
} from "@/lib/bulkEmailApi";

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/emails")({
  head: () => ({
    meta: [
      { title: "Bulk Email Campaigns — Finder" },
      {
        name: "description",
        content:
          "Create, manage, and monitor bulk email campaigns with delivery tracking.",
      },
    ],
  }),
  component: EmailsPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type View = "list" | "detail" | "create" | "edit";

type CampaignStatus = EmailCampaign["status"];

type WizardStep = "details" | "content" | "attachments" | "recipients";

interface WizardForm {
  title: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  subject: string;
  htmlContent: string;
}

const WIZARD_STEPS: { key: WizardStep; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "content", label: "Content" },
  { key: "attachments", label: "Attachments" },
  { key: "recipients", label: "Recipients" },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  VALIDATING: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  READY: "bg-primary/15 text-primary",
  QUEUED: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  PROCESSING: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  COMPLETED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  COMPLETED_WITH_ERRORS:
    "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  FAILED: "bg-destructive/15 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground/70",
};

const RECIPIENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  QUEUED: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  PROCESSING: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  SENT: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  DELIVERED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  FAILED: "bg-destructive/15 text-destructive",
  BOUNCED: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  COMPLAINED: "bg-red-500/15 text-red-600 dark:text-red-400",
  DELIVERY_DELAYED: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
};

function isActiveStatus(status: CampaignStatus): boolean {
  return status === "QUEUED" || status === "PROCESSING";
}

function canStart(status: CampaignStatus): boolean {
  return status === "DRAFT" || status === "READY";
}

function canCancel(status: CampaignStatus): boolean {
  return status === "QUEUED" || status === "PROCESSING";
}

function canRetry(status: CampaignStatus): boolean {
  return status === "COMPLETED_WITH_ERRORS" || status === "FAILED";
}

function canEdit(status: CampaignStatus): boolean {
  return status === "DRAFT" || status === "READY";
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-eyebrow">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <span
          className={`grid size-10 place-items-center rounded-xl ${tone}`}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}

// ─── Campaign Card ────────────────────────────────────────────────────────────

function CampaignCard({
  c,
  onView,
  onEdit,
  onDelete,
  onStart,
  onCancel,
  onRetry,
}: {
  c: EmailCampaign;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStart: () => void;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const sentPct =
    c.totalRecipients > 0
      ? Math.round((c.sentCount / c.totalRecipients) * 100)
      : 0;

  return (
    <article className="panel p-5 transition-all duration-200 hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={CAMPAIGN_STATUS_COLORS[c.status]}
            >
              {isActiveStatus(c.status) && (
                <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-current" />
              )}
              {c.status.replace(/_/g, " ")}
            </Badge>
            {c.attachments && c.attachments.length > 0 && (
              <Badge variant="outline" className="gap-1 text-[11px]">
                <Paperclip className="size-3" />
                {c.attachments.length}{" "}
                {c.attachments.length === 1 ? "file" : "files"}
              </Badge>
            )}
          </div>
          <h3 className="mt-2 truncate text-base font-semibold">{c.title}</h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {c.subject}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Campaign actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onView} className="gap-2">
              <Eye className="size-3.5" /> View details
            </DropdownMenuItem>
            {canEdit(c.status) && (
              <DropdownMenuItem onSelect={onEdit} className="gap-2">
                <Pencil className="size-3.5" /> Edit campaign
              </DropdownMenuItem>
            )}
            {canStart(c.status) && (
              <DropdownMenuItem
                onSelect={onStart}
                className="gap-2 text-primary focus:text-primary"
              >
                <Play className="size-3.5" /> Start campaign
              </DropdownMenuItem>
            )}
            {canCancel(c.status) && (
              <DropdownMenuItem
                onSelect={onCancel}
                className="gap-2 text-amber-500 focus:text-amber-500"
              >
                <Ban className="size-3.5" /> Cancel campaign
              </DropdownMenuItem>
            )}
            {canRetry(c.status) && (
              <DropdownMenuItem onSelect={onRetry} className="gap-2">
                <RefreshCcw className="size-3.5" /> Retry failed
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onDelete}
              className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <Trash2 className="size-3.5" /> Delete campaign
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Recipients</p>
          <p className="font-semibold">{formatCount(c.totalRecipients)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Sent</p>
          <p className="font-semibold">{formatCount(c.sentCount)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Delivered</p>
          <p className="font-semibold text-emerald-600 dark:text-emerald-400">
            {c.deliveryRate > 0 ? `${c.deliveryRate.toFixed(1)}%` : formatCount(c.deliveredCount)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Bounced</p>
          <p className="font-semibold text-orange-500">
            {formatCount(c.bouncedCount)}
          </p>
        </div>
      </div>

      {c.totalRecipients > 0 && (
        <div className="mt-4">
          <Progress value={sentPct} className="h-1.5" />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {sentPct}% sent
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {formatDate(c.createdAt)}
        </span>
        <div className="flex gap-2">
          {canStart(c.status) && (
            <Button size="sm" onClick={onStart}>
              <Play className="size-3.5" /> Start
            </Button>
          )}
          {canCancel(c.status) && (
            <Button
              size="sm"
              variant="outline"
              className="text-amber-500 border-amber-500/50 hover:bg-amber-500/10"
              onClick={onCancel}
            >
              <Ban className="size-3.5" /> Cancel
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onView}>
            <Eye className="size-3.5" /> View
          </Button>
        </div>
      </div>
    </article>
  );
}

// ─── CSV Uploader ─────────────────────────────────────────────────────────────

function CsvUploader({
  campaignId,
  onImported,
}: {
  campaignId: string | null;
  onImported: (report: CsvValidationReport) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<CsvValidationReport | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      toast.error("Only CSV files are supported.");
      return;
    }
    setSelectedFile(file);
    setValidating(true);
    setReport(null);
    try {
      const r = await bulkEmailApi.validateCsv(file);
      setReport(r);
    } catch (err) {
      toast.error("CSV validation failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setValidating(false);
    }
  }

  async function handleImport() {
    if (!selectedFile || !campaignId) return;
    setImporting(true);
    try {
      const r = await bulkEmailApi.importCsv(campaignId, selectedFile);
      setReport(r);
      onImported(r);
      toast.success(`${r.validCount} recipients imported successfully.`);
    } catch (err) {
      toast.error("Import failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <UploadCloud className="size-10 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Drop a CSV file here</p>
          <p className="mt-1 text-xs text-muted-foreground">
            or{" "}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => inputRef.current?.click()}
            >
              browse to upload
            </button>
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Required column:{" "}
          <code className="rounded bg-muted px-1 py-0.5">email</code>.
          Optional:{" "}
          <code className="rounded bg-muted px-1 py-0.5">name</code> and
          any extra metadata columns.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {validating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Validating…
          </div>
        )}
      </div>

      {report && (
        <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
          <p className="text-sm font-semibold">Validation Report</p>
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div className="rounded-lg bg-secondary/40 px-3 py-2 text-center">
              <p className="text-muted-foreground">Total rows</p>
              <p className="text-base font-bold">{report.totalRows}</p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-center">
              <p className="text-emerald-600 dark:text-emerald-400">Valid</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {report.validCount}
              </p>
            </div>
            <div className="rounded-lg bg-yellow-500/10 px-3 py-2 text-center">
              <p className="text-yellow-600 dark:text-yellow-400">Duplicates</p>
              <p className="text-base font-bold text-yellow-600 dark:text-yellow-400">
                {report.duplicateCount}
              </p>
            </div>
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-center">
              <p className="text-destructive">Invalid</p>
              <p className="text-base font-bold text-destructive">
                {report.invalidCount}
              </p>
            </div>
          </div>

          {report.detectedColumns.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Detected columns:{" "}
              {report.detectedColumns.map((col) => (
                <code
                  key={col}
                  className="mr-1 rounded bg-muted px-1 py-0.5 text-foreground"
                >
                  {col}
                </code>
              ))}
            </div>
          )}

          {report.sampleRecipients.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Sample emails:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {report.sampleRecipients.slice(0, 5).map((r) => (
                  <span
                    key={r.email}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs"
                  >
                    {r.name && (
                      <span className="font-medium">{r.name}</span>
                    )}
                    <span className="text-muted-foreground">{r.email}</span>
                  </span>
                ))}
                {report.validCount > 5 && (
                  <span className="text-xs text-muted-foreground">
                    +{report.validCount - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {report.errors.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-destructive">
                Errors ({report.errors.length}):
              </p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {report.errors.slice(0, 5).map((e, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <XCircle className="mt-0.5 size-3 shrink-0 text-destructive" />
                    <span>
                      Row {e.rowNumber}
                      {e.email ? ` (${e.email})` : ""}: {e.reason}
                    </span>
                  </li>
                ))}
                {report.errors.length > 5 && (
                  <li className="text-muted-foreground/70">
                    …and {report.errors.length - 5} more errors
                  </li>
                )}
              </ul>
            </div>
          )}

          {campaignId && report.validCount > 0 && (
            <Button
              className="w-full"
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Users className="size-4" />
              )}
              Import {report.validCount} recipients
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Attachment Uploader ──────────────────────────────────────────────────────

function AttachmentUploader({
  campaignId,
  existingAttachments,
  onAttachmentsChange,
}: {
  campaignId: string | null;
  existingAttachments: AttachmentItem[];
  onAttachmentsChange: (attachments: AttachmentItem[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    if (!campaignId) {
      toast.warning("Save the campaign first before attaching files.");
      return;
    }

    setUploading(true);
    const newAttachments: AttachmentItem[] = [];

    for (const file of Array.from(files)) {
      try {
        // 1. Get presigned URL
        const presignRes = await bulkEmailApi.presignAttachment(campaignId, {
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          fileSize: file.size,
        });

        // 2. Upload directly to S3
        const uploadRes = await fetch(presignRes.uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });
        if (!uploadRes.ok) throw new Error("S3 upload failed");

        // 3. Confirm with backend
        const confirmed = await bulkEmailApi.confirmAttachment(campaignId, {
          fileName: presignRes.fileName,
          fileUrl: presignRes.fileUrl,
          s3Key: presignRes.s3Key,
          fileSize: file.size,
          contentType: file.type || "application/octet-stream",
        });

        newAttachments.push(confirmed);
        toast.success(`"${file.name}" attached`);
      } catch (err) {
        toast.error(`Failed to attach "${file.name}"`, {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    if (newAttachments.length > 0) {
      onAttachmentsChange([...existingAttachments, ...newAttachments]);
    }
    setUploading(false);
  }

  async function handleDelete(attachment: AttachmentItem) {
    if (!campaignId) return;
    try {
      await bulkEmailApi.deleteAttachment(campaignId, attachment.id);
      onAttachmentsChange(existingAttachments.filter((a) => a.id !== attachment.id));
      toast.success(`"${attachment.fileName}" removed`);
    } catch (err) {
      toast.error("Failed to remove attachment");
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-6 text-center hover:border-primary/50 cursor-pointer transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="size-8 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Attach files</p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF, Word, images, etc. Max 10 MB per file.
          </p>
        </div>
        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Uploading…
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
          }}
        />
      </div>

      {existingAttachments.length > 0 && (
        <ul className="space-y-2">
          {existingAttachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card/60 px-3 py-2.5"
            >
              <FileText className="size-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(a.fileSize)} · {a.contentType}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(a)}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remove ${a.fileName}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Campaign Wizard (Create / Edit) ─────────────────────────────────────────

function CampaignWizard({
  initialCampaign,
  onClose,
  onSaved,
}: {
  initialCampaign: EmailCampaign | null;
  onClose: () => void;
  onSaved: (campaign: EmailCampaign) => void;
}) {
  const isEditing = !!initialCampaign;
  const [step, setStep] = useState<WizardStep>("details");
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [campaign, setCampaign] = useState<EmailCampaign | null>(
    initialCampaign
  );
  const [attachments, setAttachments] = useState<AttachmentItem[]>(
    initialCampaign?.attachments ?? []
  );
  const [importedCount, setImportedCount] = useState(0);
  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("edit");

  const [form, setForm] = useState<WizardForm>({
    title: initialCampaign?.title ?? "",
    fromName: initialCampaign?.fromName ?? "",
    fromEmail: initialCampaign?.fromEmail ?? "",
    replyTo: initialCampaign?.replyTo ?? "",
    subject: initialCampaign?.subject ?? "",
    htmlContent: initialCampaign?.htmlContent ?? "",
  });

  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.key === step);

  function patch(field: keyof WizardForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function saveDraft(): Promise<EmailCampaign | null> {
    if (!form.title.trim() || !form.fromName.trim() || !form.fromEmail.trim()) {
      toast.error("Please fill in title, sender name, and sender email.");
      return null;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        subject: form.subject.trim() || undefined,
        htmlContent: form.htmlContent.trim() || undefined,
        fromName: form.fromName.trim(),
        fromEmail: form.fromEmail.trim(),
        replyTo: form.replyTo.trim() || undefined,
      };

      const saved = campaign
        ? await bulkEmailApi.updateCampaign(campaign.id, payload)
        : await bulkEmailApi.createCampaign(payload);

      setCampaign(saved);
      toast.success("Draft saved.");
      return saved;
    } catch (err) {
      toast.error("Failed to save draft", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    if (step === "details") {
      const saved = await saveDraft();
      if (!saved) return;
    }
    const nextIdx = currentStepIndex + 1;
    if (nextIdx < WIZARD_STEPS.length) {
      setStep(WIZARD_STEPS[nextIdx].key);
    }
  }

  async function handleStartCampaign() {
    if (!form.subject.trim()) {
      toast.error("Please provide an email subject before starting the campaign.");
      setStep("content");
      return;
    }
    if (!form.htmlContent.trim()) {
      toast.error("Please provide email body content before starting the campaign.");
      setStep("content");
      return;
    }

    const saved = await saveDraft();
    if (!saved) return;

    setStarting(true);
    try {
      const started = await bulkEmailApi.startCampaign(saved.id);
      toast.success("Campaign queued! Emails will be sent shortly.");
      onSaved(started);
    } catch (err) {
      toast.error("Failed to start campaign", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setStarting(false);
    }
  }

  const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-8">
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:bg-secondary"
          aria-label="Close wizard"
        >
          <X className="size-5" />
        </button>
        <h2 className="font-semibold">
          {isEditing ? "Edit Campaign" : "New Campaign"}
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={saveDraft}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Save draft
          </Button>
          {isLastStep && (
            <Button
              size="sm"
              onClick={handleStartCampaign}
              disabled={starting || saving}
            >
              {starting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Start campaign
            </Button>
          )}
        </div>
      </div>

      {/* Step indicators */}
      <div className="shrink-0 border-b border-border bg-secondary/20 px-4 py-2 md:px-8">
        <ol className="flex items-center gap-1">
          {WIZARD_STEPS.map((s, i) => (
            <li key={s.key} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => i <= currentStepIndex && setStep(s.key)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  step === s.key
                    ? "bg-primary text-primary-foreground"
                    : i < currentStepIndex
                    ? "bg-primary/15 text-primary hover:bg-primary/20"
                    : "text-muted-foreground"
                }`}
              >
                <span
                  className={`grid size-4 place-items-center rounded-full text-[10px] font-bold ${
                    step === s.key
                      ? "bg-primary-foreground/20"
                      : i < currentStepIndex
                      ? "bg-primary/20"
                      : "bg-muted"
                  }`}
                >
                  {i < currentStepIndex ? (
                    <CheckCircle2 className="size-3" />
                  ) : (
                    i + 1
                  )}
                </span>
                {s.label}
              </button>
              {i < WIZARD_STEPS.length - 1 && (
                <ChevronRight className="size-3 text-muted-foreground/40" />
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto max-w-2xl space-y-5">
          {/* Step 1: Details */}
          {step === "details" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="campaign-title">Campaign Title *</Label>
                <Input
                  id="campaign-title"
                  placeholder="e.g. November Newsletter"
                  value={form.title}
                  onChange={(e) => patch("title", e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="from-name">Sender Name *</Label>
                  <Input
                    id="from-name"
                    placeholder="Finder Careers"
                    value={form.fromName}
                    onChange={(e) => patch("fromName", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="from-email">Sender Email *</Label>
                  <Input
                    id="from-email"
                    type="email"
                    placeholder="no-reply@example.com"
                    value={form.fromEmail}
                    onChange={(e) => patch("fromEmail", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reply-to">Reply-To Email (optional)</Label>
                <Input
                  id="reply-to"
                  type="email"
                  placeholder="support@example.com"
                  value={form.replyTo}
                  onChange={(e) => patch("replyTo", e.target.value)}
                />
              </div>
            </>
          )}

          {/* Step 2: Content */}
          {step === "content" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Your subject line…"
                  value={form.subject}
                  onChange={(e) => patch("subject", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>HTML Body</Label>
                  <Tabs
                    value={previewTab}
                    onValueChange={(v) =>
                      setPreviewTab(v as "edit" | "preview")
                    }
                  >
                    <TabsList className="h-7">
                      <TabsTrigger value="edit" className="h-6 px-3 text-xs">
                        Edit
                      </TabsTrigger>
                      <TabsTrigger
                        value="preview"
                        className="h-6 px-3 text-xs"
                      >
                        <Eye className="mr-1 size-3" /> Preview
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {previewTab === "edit" ? (
                  <Textarea
                    className="min-h-80 font-mono text-xs"
                    placeholder="<h1>Hello {{name}},</h1><p>Your email body here…</p>"
                    value={form.htmlContent}
                    onChange={(e) => patch("htmlContent", e.target.value)}
                  />
                ) : (
                  <div
                    className="min-h-80 w-full overflow-auto rounded-lg border border-border bg-white p-4 text-sm text-foreground dark:bg-zinc-900"
                    // Safe: admin-only page, user controls their own HTML content
                    dangerouslySetInnerHTML={{
                      __html:
                        form.htmlContent ||
                        "<p class='text-muted-foreground'>Nothing to preview yet.</p>",
                    }}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Use{" "}
                  <code className="rounded bg-muted px-1 py-0.5">
                    {"{{name}}"}
                  </code>{" "}
                  for recipient name personalization.
                </p>
              </div>
            </>
          )}

          {/* Step 3: Attachments */}
          {step === "attachments" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Attachments are optional. Files are stored in S3 and sent with
                every email in this campaign.
              </p>
              <AttachmentUploader
                campaignId={campaign?.id ?? null}
                existingAttachments={attachments}
                onAttachmentsChange={setAttachments}
              />
            </div>
          )}

          {/* Step 4: Recipients CSV */}
          {step === "recipients" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Upload a CSV file containing recipient email addresses. Existing
                recipients will be replaced.
              </p>
              {!campaign && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
                  Save the campaign details first to enable CSV import.
                </div>
              )}
              <CsvUploader
                campaignId={campaign?.id ?? null}
                onImported={(r) => setImportedCount(r.validCount)}
              />
              {importedCount > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4 shrink-0" />
                  {importedCount} recipients ready.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer nav */}
      <div className="shrink-0 flex items-center justify-between border-t border-border bg-background/90 px-4 py-3 backdrop-blur md:px-8">
        <Button
          variant="ghost"
          disabled={currentStepIndex === 0}
          onClick={() => setStep(WIZARD_STEPS[currentStepIndex - 1].key)}
        >
          <ChevronLeft className="size-4" /> Back
        </Button>
        {!isLastStep ? (
          <Button onClick={handleNext} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Next <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={async () => {
              const saved = await saveDraft();
              if (saved) onSaved(saved);
            }}
            disabled={saving}
            variant="outline"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Finish &amp; close
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Campaign Detail View ─────────────────────────────────────────────────────

function CampaignDetail({
  campaign: initialCampaign,
  onBack,
  onEdit,
  onUpdated,
}: {
  campaign: EmailCampaign;
  onBack: () => void;
  onEdit: () => void;
  onUpdated: (c: EmailCampaign) => void;
}) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRecipients = useCallback(
    async (pg = page) => {
      setLoading(true);
      try {
        const data = await bulkEmailApi.getRecipients(campaign.id, {
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          search: search || undefined,
          page: pg,
          size: 20,
        });
        setRecipients(data.content ?? data);
        setTotalPages(data.totalPages ?? 1);
        setTotalElements(data.totalElements ?? (data.content ?? data).length);
      } catch {
        // silent on polling errors
      } finally {
        setLoading(false);
      }
    },
    [campaign.id, statusFilter, search, page]
  );

  const refreshCampaign = useCallback(async () => {
    try {
      const updated = await bulkEmailApi.getCampaignById(campaign.id);
      setCampaign(updated);
      onUpdated(updated);
      if (!isActiveStatus(updated.status)) {
        clearInterval(refreshIntervalRef.current!);
      }
    } catch {
      // silent
    }
  }, [campaign.id, onUpdated]);

  useEffect(() => {
    fetchRecipients(0);
    setPage(0);
  }, [statusFilter, search, campaign.id]);

  useEffect(() => {
    fetchRecipients(page);
  }, [page]);

  // Auto-refresh while active
  useEffect(() => {
    if (isActiveStatus(campaign.status)) {
      refreshIntervalRef.current = setInterval(() => {
        refreshCampaign();
        fetchRecipients(page);
      }, 5000);
    }
    return () => {
      if (refreshIntervalRef.current)
        clearInterval(refreshIntervalRef.current);
    };
  }, [campaign.status, page, refreshCampaign, fetchRecipients]);

  async function handleStart() {
    setActionLoading(true);
    try {
      const updated = await bulkEmailApi.startCampaign(campaign.id);
      setCampaign(updated);
      onUpdated(updated);
      toast.success("Campaign queued successfully.");
    } catch (err) {
      toast.error("Failed to start campaign", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    setActionLoading(true);
    try {
      const updated = await bulkEmailApi.cancelCampaign(campaign.id);
      setCampaign(updated);
      onUpdated(updated);
      toast.success("Campaign cancelled.");
    } catch (err) {
      toast.error("Failed to cancel campaign", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRetry() {
    setActionLoading(true);
    try {
      const updated = await bulkEmailApi.retryFailed(campaign.id);
      setCampaign(updated);
      onUpdated(updated);
      toast.success("Retry queued for failed recipients.");
    } catch (err) {
      toast.error("Failed to retry", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleExportFailed() {
    try {
      await bulkEmailApi.downloadFailedCsv(campaign.id);
      toast.success("Failed recipients CSV downloaded.");
    } catch (err) {
      toast.error("Export failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  const sentPct =
    campaign.totalRecipients > 0
      ? Math.round((campaign.sentCount / campaign.totalRecipients) * 100)
      : 0;

  const deliveredPct =
    campaign.sentCount > 0
      ? Math.round((campaign.deliveredCount / campaign.sentCount) * 100)
      : 0;

  const bouncePct =
    campaign.sentCount > 0
      ? Math.round((campaign.bouncedCount / campaign.sentCount) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 -mx-4 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Campaigns
        </button>
        <span className="text-muted-foreground/40">/</span>
        <span className="truncate font-medium">{campaign.title}</span>
        <Badge
          variant="secondary"
          className={`ml-1 ${CAMPAIGN_STATUS_COLORS[campaign.status]}`}
        >
          {isActiveStatus(campaign.status) && (
            <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-current" />
          )}
          {campaign.status.replace(/_/g, " ")}
        </Badge>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {isActiveStatus(campaign.status) && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Auto-refreshing…
            </span>
          )}
          {canEdit(campaign.status) && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="size-4" /> Edit
            </Button>
          )}
          {canStart(campaign.status) && (
            <Button
              size="sm"
              onClick={handleStart}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}{" "}
              Start
            </Button>
          )}
          {canCancel(campaign.status) && (
            <Button
              size="sm"
              variant="outline"
              className="text-amber-500 border-amber-500/50"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Ban className="size-4" />
              )}{" "}
              Cancel
            </Button>
          )}
          {canRetry(campaign.status) && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCcw className="size-4" />
              )}{" "}
              Retry failed
            </Button>
          )}
          {(campaign.failedCount > 0 || campaign.bouncedCount > 0) && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportFailed}
            >
              <Download className="size-4" /> Export failed CSV
            </Button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Recipients"
          value={formatCount(campaign.totalRecipients)}
          icon={Users}
          tone="bg-primary/10 text-primary"
        />
        <StatCard
          label="Sent"
          value={formatCount(campaign.sentCount)}
          sub={`${sentPct}% of total`}
          icon={Send}
          tone="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Delivered"
          value={`${deliveredPct}%`}
          sub={`${formatCount(campaign.deliveredCount)} emails`}
          icon={CheckCircle2}
          tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Bounced / Failed"
          value={formatCount(campaign.bouncedCount + campaign.failedCount)}
          sub={`${bouncePct}% bounce rate`}
          icon={AlertTriangle}
          tone="bg-orange-500/10 text-orange-500"
        />
      </div>

      {/* Send progress */}
      <div className="panel p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Send progress</span>
          <span className="text-muted-foreground">
            {formatCount(campaign.sentCount)} /{" "}
            {formatCount(campaign.totalRecipients)}
          </span>
        </div>
        <Progress value={sentPct} className="h-2" />
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {campaign.startedAt && (
            <span>Started: {formatDateTime(campaign.startedAt)}</span>
          )}
          {campaign.completedAt && (
            <span>Completed: {formatDateTime(campaign.completedAt)}</span>
          )}
          {campaign.errorMessage && (
            <span className="text-destructive">
              Error: {campaign.errorMessage}
            </span>
          )}
        </div>
      </div>

      {/* Attachments */}
      {campaign.attachments && campaign.attachments.length > 0 && (
        <div className="panel p-5">
          <p className="mb-3 text-sm font-medium">Attachments</p>
          <ul className="space-y-2">
            {campaign.attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <FileText className="size-4 shrink-0 text-primary" />
                <span className="font-medium text-foreground">{a.fileName}</span>
                <span className="text-xs">{formatBytes(a.fileSize)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recipients table */}
      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <p className="font-medium">
            Recipients{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({totalElements})
            </span>
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 w-48 pl-8 text-xs"
                placeholder="Search email…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(0);
              }}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                {["ALL", "PENDING", "QUEUED", "PROCESSING", "SENT", "DELIVERED", "FAILED", "BOUNCED", "COMPLAINED", "DELIVERY_DELAYED"].map(
                  (s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s === "ALL" ? "All statuses" : s}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={() => fetchRecipients(page)}
            >
              <RefreshCcw className="size-3.5" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground gap-2">
            <Loader2 className="size-4 animate-spin text-primary" /> Loading
            recipients…
          </div>
        ) : recipients.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No recipients found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent at</TableHead>
                  <TableHead>Delivered at</TableHead>
                  <TableHead className="text-right">Retries</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">
                      {r.email}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.name ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-[11px] ${RECIPIENT_STATUS_COLORS[r.status] ?? ""}`}
                      >
                        {r.status}
                      </Badge>
                      {r.errorMessage && (
                        <p className="mt-0.5 text-[10px] text-destructive line-clamp-1">
                          {r.errorMessage}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(r.sentAt)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(r.deliveredAt)}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {r.retryCount > 0 ? (
                        <span className="text-amber-500">{r.retryCount}×</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────

function DeleteDialog({
  campaign,
  open,
  onOpenChange,
  onDeleted,
}: {
  campaign: EmailCampaign | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    if (!campaign) return;
    setDeleting(true);
    try {
      await bulkEmailApi.deleteCampaign(campaign.id);
      toast.success(`"${campaign.title}" deleted.`);
      onDeleted();
    } catch (err) {
      toast.error("Failed to delete campaign", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDeleting(false);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete campaign?</DialogTitle>
          <DialogDescription>
            This will permanently delete &quot;{campaign?.title}&quot; and all
            its recipients. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirm}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="size-4 animate-spin" /> : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function EmailsPage() {
  const [view, setView] = useState<View>("list");
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listPage, setListPage] = useState(0);
  const [listTotalPages, setListTotalPages] = useState(0);
  const [listTotal, setListTotal] = useState(0);

  const [selectedCampaign, setSelectedCampaign] =
    useState<EmailCampaign | null>(null);
  const [editingCampaign, setEditingCampaign] =
    useState<EmailCampaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] =
    useState<EmailCampaign | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCampaigns = useCallback(
    async (pg = listPage) => {
      setLoadingList(true);
      try {
        const data = await bulkEmailApi.getCampaigns(pg, 12);
        const items: EmailCampaign[] = data.content ?? data;
        // Client-side search filter if backend doesn't support it
        const filtered = searchQuery
          ? items.filter(
              (c) =>
                c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.subject.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : items;
        setCampaigns(filtered);
        setListTotalPages(data.totalPages ?? 1);
        setListTotal(data.totalElements ?? items.length);
      } catch (err) {
        toast.error("Failed to load campaigns");
      } finally {
        setLoadingList(false);
      }
    },
    [listPage, searchQuery]
  );

  useEffect(() => {
    if (view === "list") fetchCampaigns(listPage);
  }, [view, listPage, searchQuery]);

  function handleCampaignSaved(c: EmailCampaign) {
    setCampaigns((prev) => {
      const idx = prev.findIndex((x) => x.id === c.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = c;
        return copy;
      }
      return [c, ...prev];
    });
    setSelectedCampaign(null);
    setEditingCampaign(null);
    setView("list");
    fetchCampaigns(0);
  }

  function handleCampaignUpdated(c: EmailCampaign) {
    setCampaigns((prev) =>
      prev.map((x) => (x.id === c.id ? c : x))
    );
    if (selectedCampaign?.id === c.id) setSelectedCampaign(c);
  }

  function openCreate() {
    setSelectedCampaign(null);
    setEditingCampaign(null);
    setView("create");
  }

  function openDetail(c: EmailCampaign) {
    setSelectedCampaign(c);
    setView("detail");
  }

  function openEdit(c: EmailCampaign) {
    setEditingCampaign(c);
    setView("edit");
  }

  function handleDeleted() {
    setSelectedCampaign(null);
    setEditingCampaign(null);
    fetchCampaigns(0);
    setListPage(0);
    if (view === "detail") setView("list");
    setDeletingCampaign(null);
  }

  // Wizard views
  if (view === "create" || view === "edit") {
    return (
      <CampaignWizard
        key={view === "edit" ? `edit-${editingCampaign?.id}` : `create-${Date.now()}`}
        initialCampaign={view === "edit" ? editingCampaign : null}
        onClose={() => {
          setView(selectedCampaign ? "detail" : "list");
          setEditingCampaign(null);
        }}
        onSaved={(c) => {
          handleCampaignSaved(c);
          setEditingCampaign(null);
        }}
      />
    );
  }

  // Detail view
  if (view === "detail" && selectedCampaign) {
    return (
      <div className="relative min-h-[calc(100dvh-61px)]">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
          <CampaignDetail
            campaign={selectedCampaign}
            onBack={() => {
              setSelectedCampaign(null);
              setView("list");
            }}
            onEdit={() => openEdit(selectedCampaign)}
            onUpdated={handleCampaignUpdated}
          />
        </div>
        <DeleteDialog
          campaign={deletingCampaign}
          open={!!deletingCampaign}
          onOpenChange={(v) => !v && setDeletingCampaign(null)}
          onDeleted={handleDeleted}
        />
      </div>
    );
  }

  // List view
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
      <PageHeader
        title="Bulk Email Campaigns"
        description="Create, monitor, and manage email campaigns with real-time delivery tracking."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> New Campaign
          </Button>
        }
      />

      {/* Search bar */}
      <div className="mt-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search campaigns…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setListPage(0);
            }}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchCampaigns(listPage)}
          aria-label="Refresh"
        >
          <RefreshCcw className="size-4" />
        </Button>
      </div>

      {/* Campaign list */}
      <div className="mt-6">
        {loadingList ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" /> Loading
            campaigns…
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center">
            <span className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Mail className="size-8" />
            </span>
            <div>
              <p className="text-lg font-semibold">No campaigns yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first bulk email campaign to get started.
              </p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="size-4" /> New Campaign
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => (
              <CampaignCard
                key={c.id}
                c={c}
                onView={() => openDetail(c)}
                onEdit={() => openEdit(c)}
                onDelete={() => setDeletingCampaign(c)}
                onStart={async () => {
                  try {
                    const updated = await bulkEmailApi.startCampaign(c.id);
                    handleCampaignUpdated(updated);
                    toast.success("Campaign started.");
                  } catch (err) {
                    toast.error("Failed to start campaign", {
                      description:
                        err instanceof Error ? err.message : undefined,
                    });
                  }
                }}
                onCancel={async () => {
                  try {
                    const updated = await bulkEmailApi.cancelCampaign(c.id);
                    handleCampaignUpdated(updated);
                    toast.success("Campaign cancelled.");
                  } catch (err) {
                    toast.error("Failed to cancel campaign", {
                      description:
                        err instanceof Error ? err.message : undefined,
                    });
                  }
                }}
                onRetry={async () => {
                  try {
                    const updated = await bulkEmailApi.retryFailed(c.id);
                    handleCampaignUpdated(updated);
                    toast.success("Retry queued.");
                  } catch (err) {
                    toast.error("Retry failed", {
                      description:
                        err instanceof Error ? err.message : undefined,
                    });
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {listTotalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={listPage === 0}
              onClick={() => setListPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {listPage + 1} of {listTotalPages} · {listTotal} campaigns
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={listPage >= listTotalPages - 1}
              onClick={() => setListPage((p) => p + 1)}
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <DeleteDialog
        campaign={deletingCampaign}
        open={!!deletingCampaign}
        onOpenChange={(v) => !v && setDeletingCampaign(null)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}

