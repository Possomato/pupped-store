import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  key: string;
  url: string;
}

export async function uploadImage(
  file: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw new Error(
      `Invalid file type: ${mimeType}. Allowed types: ${ALLOWED_TYPES.join(", ")}`
    );
  }

  if (file.length > MAX_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB`);
  }

  const extension = originalName.split(".").pop() || "jpg";
  const key = `products/${randomUUID()}.${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: file,
      ContentType: mimeType,
    })
  );

  return {
    key,
    url: `${process.env.R2_PUBLIC_URL}/${key}`,
  };
}

export async function deleteImage(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    })
  );
}

export function getImageUrl(key: string): string {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
