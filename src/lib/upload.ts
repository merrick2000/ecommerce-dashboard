import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  // Ensure we use path-style requests if needed by the compatible provider,
  // but usually auto works. Let's force path style just in case it's required for custom endpoints like t3.storageapi.dev
  forcePathStyle: true,
});

export async function uploadFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split('.').pop();
  const uniqueName = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
  const bucket = process.env.S3_BUCKET_NAME!;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: uniqueName,
    Body: buffer,
    ContentType: file.type,
    ACL: "public-read", // We make it public to serve it immediately for now
  });

  await s3Client.send(command);

  // Return the public URL
  return `${process.env.S3_ENDPOINT}/${bucket}/${uniqueName}`;
}
