// src/config/multer.ts
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from "@aws-sdk/client-s3";
import { Request } from 'express';

// 配置 AWS S3
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const postUpload = multer({
    storage: multerS3({
        s3,
        bucket: process.env.AWS_S3_BUCKET_NAME || '', // S3 Bucket 名稱
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: (_req: Request, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (_req: Request, file, cb) => {
            cb(null, `uploads/${Date.now()}-${file.originalname}`);
        },
    }),
    limits: {
        fileSize: 5 * 1024 * 1024, // 檔案最大限制為 5MB
    },
    fileFilter: (_req: Request, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    },
});

const avatarUpload = multer({
    storage: multerS3({
        s3,
        bucket: process.env.AWS_S3_BUCKET_NAME || '', // S3 Bucket 名稱
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: (_req: Request, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (_req: Request, file, cb) => {
            cb(null, `avatar/${Date.now()}-${file.originalname}`);
        },
    }),
    limits: {
        fileSize: 5 * 1024 * 1024, // 檔案最大限制為 5MB
    },
    fileFilter: (_req: Request, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    },
});

export { postUpload, avatarUpload };