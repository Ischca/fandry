import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "fandry-media";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

// File size limits
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Allowed MIME types
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov
];

export const ALLOWED_MIME_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// Check if R2 is configured
export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

// Create S3 client for R2
function getR2Client(): S3Client | null {
  if (!isR2Configured()) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
}

// Validate file type
export function validateFileType(mimeType: string): { valid: boolean; type: "image" | "video" | null; error?: string } {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return { valid: true, type: "image" };
  }
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) {
    return { valid: true, type: "video" };
  }
  return { valid: false, type: null, error: `Invalid file type: ${mimeType}` };
}

// Validate file size
export function validateFileSize(size: number, type: "image" | "video"): { valid: boolean; error?: string } {
  const maxSize = type === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  if (size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return { valid: false, error: `File too large. Maximum size for ${type} is ${maxSizeMB}MB` };
  }
  return { valid: true };
}

// Generate unique file key
export function generateFileKey(userId: number, fileName: string, mimeType: string): string {
  const ext = getExtensionFromMimeType(mimeType);
  const uuid = uuidv4();
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return `uploads/${userId}/${date}/${uuid}${ext}`;
}

// Get file extension from MIME type
function getExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
  };
  return extensions[mimeType] || "";
}

// Generate presigned URL for upload
export async function generatePresignedUploadUrl(
  userId: number,
  fileName: string,
  contentType: string,
  fileSize: number
): Promise<{ url: string; key: string; publicUrl: string } | { error: string }> {
  // Validate file type
  const typeValidation = validateFileType(contentType);
  if (!typeValidation.valid || !typeValidation.type) {
    return { error: typeValidation.error || "Invalid file type" };
  }

  // Validate file size
  const sizeValidation = validateFileSize(fileSize, typeValidation.type);
  if (!sizeValidation.valid) {
    return { error: sizeValidation.error || "File too large" };
  }

  // Check R2 configuration
  const client = getR2Client();
  if (!client) {
    return { error: "Storage not configured. Please set R2 environment variables." };
  }

  // Generate unique key
  const key = generateFileKey(userId, fileName, contentType);

  // Generate presigned URL
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentLength: fileSize,
  });

  try {
    const url = await getSignedUrl(client, command, { expiresIn: 900 }); // 15 minutes
    const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : `https://${R2_BUCKET_NAME}.r2.cloudflarestorage.com/${key}`;

    return { url, key, publicUrl };
  } catch (error) {
    console.error("Failed to generate presigned URL:", error);
    return { error: "Failed to generate upload URL" };
  }
}

// Delete file from R2
export async function deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
  const client = getR2Client();
  if (!client) {
    return { success: false, error: "Storage not configured" };
  }

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  try {
    await client.send(command);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete file:", error);
    return { success: false, error: "Failed to delete file" };
  }
}
