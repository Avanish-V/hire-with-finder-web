import { apiRequest, getFreshAuthToken } from "./apiClient";

const API_URL = import.meta.env.VITE_API_URL || "https://bmo6sd3nhbgp4akoqmgoamd3ja0cmyyn.lambda-url.ap-south-1.on.aws/";

function buildUrl(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const base = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  return `${base}${cleanEndpoint}`;
}

export interface EmailCampaign {
  id: string;
  title: string;
  subject: string;
  htmlContent: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string | null;
  status:
    | "DRAFT"
    | "VALIDATING"
    | "READY"
    | "QUEUED"
    | "PROCESSING"
    | "COMPLETED"
    | "COMPLETED_WITH_ERRORS"
    | "FAILED"
    | "CANCELLED";
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  bouncedCount: number;
  complainedCount: number;
  deliveryRate: number;
  bounceRate: number;
  csvFileUrl?: string | null;
  errorMessage?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  attachments?: AttachmentItem[];
}

export interface AttachmentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  s3Key: string;
  fileSize: number;
  contentType: string;
  createdAt: string;
}

export interface EmailRecipient {
  id: string;
  campaignId: string;
  email: string;
  name?: string | null;
  metadata?: Record<string, string> | null;
  status:
    | "PENDING"
    | "QUEUED"
    | "PROCESSING"
    | "SENT"
    | "DELIVERED"
    | "FAILED"
    | "BOUNCED"
    | "COMPLAINED"
    | "DELIVERY_DELAYED";
  sesMessageId?: string | null;
  errorMessage?: string | null;
  retryCount: number;
  sentAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
}

export interface CsvValidationReport {
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  detectedColumns: string[];
  errors: { rowNumber: number; email?: string | null; reason: string }[];
  sampleRecipients: { email: string; name?: string | null; metadata?: Record<string, string> }[];
}

export const bulkEmailApi = {
  getCampaigns: async (page = 0, size = 20) => {
    const res = await apiRequest(`/api/admin/email-campaigns?page=${page}&size=${size}`);
    if (!res.ok) throw new Error("Failed to fetch campaigns");
    return res.json();
  },

  getCampaignById: async (id: string): Promise<EmailCampaign> => {
    const res = await apiRequest(`/api/admin/email-campaigns/${id}`);
    if (!res.ok) throw new Error("Failed to fetch campaign details");
    return res.json();
  },

  createCampaign: async (data: {
    title: string;
    subject?: string;
    htmlContent?: string;
    fromName: string;
    fromEmail: string;
    replyTo?: string;
  }): Promise<EmailCampaign> => {
    const res = await apiRequest("/api/admin/email-campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create campaign");
    }
    return res.json();
  },

  updateCampaign: async (
    id: string,
    data: {
      title: string;
      subject?: string;
      htmlContent?: string;
      fromName: string;
      fromEmail: string;
      replyTo?: string;
    }
  ): Promise<EmailCampaign> => {
    const res = await apiRequest(`/api/admin/email-campaigns/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update campaign");
    }
    return res.json();
  },

  deleteCampaign: async (id: string) => {
    const res = await apiRequest(`/api/admin/email-campaigns/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete campaign");
  },

  validateCsv: async (file: File): Promise<CsvValidationReport> => {
    const token = await getFreshAuthToken();
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = buildUrl("/api/admin/email-campaigns/validate-csv");
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to validate CSV");
    }
    return res.json();
  },

  importCsv: async (campaignId: string, file: File): Promise<CsvValidationReport> => {
    const token = await getFreshAuthToken();
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = buildUrl(`/api/admin/email-campaigns/${campaignId}/recipients/csv`);
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to import CSV recipients");
    }
    return res.json();
  },

  presignAttachment: async (campaignId: string, file: { fileName: string; contentType: string; fileSize: number }) => {
    const res = await apiRequest(`/api/admin/email-campaigns/${campaignId}/attachments/presign`, {
      method: "POST",
      body: JSON.stringify(file),
    });
    if (!res.ok) throw new Error("Failed to generate presigned upload URL");
    return res.json();
  },

  confirmAttachment: async (
    campaignId: string,
    data: { fileName: string; fileUrl: string; s3Key: string; fileSize: number; contentType: string }
  ) => {
    const res = await apiRequest(`/api/admin/email-campaigns/${campaignId}/attachments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to attach file to campaign");
    return res.json();
  },

  deleteAttachment: async (campaignId: string, attachmentId: string) => {
    const res = await apiRequest(`/api/admin/email-campaigns/${campaignId}/attachments/${attachmentId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete attachment");
  },

  startCampaign: async (id: string): Promise<EmailCampaign> => {
    const res = await apiRequest(`/api/admin/email-campaigns/${id}/start`, {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to start campaign");
    }
    return res.json();
  },

  cancelCampaign: async (id: string): Promise<EmailCampaign> => {
    const res = await apiRequest(`/api/admin/email-campaigns/${id}/cancel`, {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to cancel campaign");
    }
    return res.json();
  },

  retryFailed: async (id: string): Promise<EmailCampaign> => {
    const res = await apiRequest(`/api/admin/email-campaigns/${id}/retry-failed`, {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to retry failed recipients");
    }
    return res.json();
  },

  getRecipients: async (
    campaignId: string,
    params: { status?: string; search?: string; page?: number; size?: number } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== "ALL") query.append("status", params.status);
    if (params.search) query.append("search", params.search);
    query.append("page", String(params.page || 0));
    query.append("size", String(params.size || 50));

    const res = await apiRequest(`/api/admin/email-campaigns/${campaignId}/recipients?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch recipients");
    return res.json();
  },

  downloadFailedCsv: async (campaignId: string) => {
    const token = await getFreshAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = buildUrl(`/api/admin/email-campaigns/${campaignId}/failed-export`);
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error("Failed to download failed recipients CSV");

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `failed_recipients_${campaignId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};

