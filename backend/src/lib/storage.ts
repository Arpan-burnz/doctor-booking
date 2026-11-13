import { env } from '../config/env';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

export const uploadFile = async (
  file: Express.Multer.File,
  folder: string = 'prescriptions'
): Promise<string> => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext) || (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype))) {
    throw new Error('Invalid file type. Only PDF and image files are permitted.');
  }

  const sanitizedBasename = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
  const safeFileName = `${crypto.randomUUID()}-${sanitizedBasename}`;

  // If no AWS keys — save locally to disk so admin can view/download
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.AWS_BUCKET_NAME) {
    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const localFilePath = path.join(uploadDir, safeFileName);
    fs.writeFileSync(localFilePath, file.buffer);
    console.log(`📁 File saved locally to: ${localFilePath}`);
    return `/uploads/${folder}/${safeFileName}`;
  }

  // Only runs if AWS keys are actually set
  try {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const s3 = new S3Client({
      region: env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const fileKey = `${folder}/${safeFileName}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    return `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${fileKey}`;
  } catch (err: any) {
    console.error('❌ S3 upload failed:', err.message);
    throw new Error('File upload failed');
  }
};