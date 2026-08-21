import { apiRequest } from "@/lib/apiClient";

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  url: string;
  key: string;
}

/**
 * Fetch a presigned S3 upload URL from the backend
 */
export async function getPresignedUploadUrl(
  fileName: string,
  contentType?: string,
  folder: string = "live-skills/thumbnails",
): Promise<PresignedUrlResponse | null> {
  try {
    const params = new URLSearchParams({
      fileName,
      ...(contentType ? { contentType } : {}),
      ...(folder ? { folder } : {}),
    });

    console.log("Requesting presigned URL:", `/api/media/presign?${params.toString()}`);
    
    const res = await apiRequest(`/api/media/presign?${params.toString()}`);
    
    console.log("Presigned URL response status:", res.status, res.ok);
    
    if (res.ok) {
      const data = (await res.json()) as PresignedUrlResponse;
      console.log("Presigned URL data:", data);
      
      if (data.uploadUrl && data.fileUrl) {
        return data;
      } else {
        console.error("Presigned URL response missing required fields:", data);
      }
    } else {
      const errorText = await res.text();
      console.error("Failed to get presigned URL:", res.status, errorText);
    }
  } catch (error) {
    console.error("Error getting presigned upload URL:", error);
  }
  return null;
}

/**
 * Upload an image file directly to AWS S3 using a presigned PUT URL.
 * Returns the public S3 URL of the uploaded file.
 */
export async function uploadToS3(
  file: File,
  folder: string = "live-skills/thumbnails",
): Promise<string> {
  console.log("Starting S3 upload for file:", file.name, "to folder:", folder);
  
  const presignData = await getPresignedUploadUrl(
    file.name,
    file.type || "image/jpeg",
    folder,
  );

  if (!presignData) {
    console.error("No presigned data received from backend");
    throw new Error("Failed to get presigned upload URL from backend");
  }

  if (presignData?.uploadUrl) {
    console.log("Uploading to S3 via presigned URL:", presignData.uploadUrl);
    
    try {
      const uploadRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "image/jpeg",
        },
        body: file,
      });

      console.log("S3 upload response:", uploadRes.status, uploadRes.statusText);

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text().catch(() => "No error body");
        console.error("S3 upload failed:", uploadRes.status, errorText);
        throw new Error(`S3 upload failed with status: ${uploadRes.status} - ${errorText}`);
      }

      console.log("S3 upload successful, file URL:", presignData.fileUrl);
      return presignData.fileUrl;
    } catch (error) {
      console.error("S3 upload network error:", error);
      throw error;
    }
  }

  console.warn("No uploadUrl in presigned data, falling back to base64");
  
  // Fallback: If backend is unreachable or local mock mode, convert to base64 data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        console.log("Fallback: Using base64 data URL");
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsDataURL(file);
  });
}
