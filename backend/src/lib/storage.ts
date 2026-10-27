import { env } from '../config/env';
import crypto from 'crypto';

export const uploadFile = async (
  file: Express.Multer.File,
  folder: string = 'prescriptions'
): Promise<string> => {
  // If no AWS keys — return mock URL immediately, don't touch S3
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.AWS_BUCKET_NAME) {
    console.log('📁 S3 skipped — returning mock URL');
    const mockKey = `${folder}/${crypto.randomUUID()}-${file.originalname}`;
    return `https://mock-s3.local/${mockKey}`;
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

    const fileKey = `${folder}/${crypto.randomUUID()}-${file.originalname}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    return `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${fileKey}`;
  } catch (err) {
    console.error('❌ S3 upload failed:', err);
    throw new Error('File upload failed');
  }
};