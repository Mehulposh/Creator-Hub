import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads/lesson-pdfs');
const productUploadDir = path.join(__dirname, '../../uploads/product-files');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(productUploadDir)) fs.mkdirSync(productUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

const productStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, productUploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});

const productUpload = multer({
  storage: productStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'application/zip', 'application/x-zip-compressed', 'image/png', 'image/jpeg', 'audio/mpeg', 'video/mp4'];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('application/')) cb(null, true);
    else cb(new Error('File type not supported'));
  }
});

export const uploadsRouter = Router();
uploadsRouter.use(requireAuth, requireCreator);

uploadsRouter.post('/product-file', productUpload.single('file'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const baseUrl = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
    res.json({
      url: `${baseUrl}/api/uploads/product-files/${req.file.filename}`,
      filename: req.file.originalname
    });
  } catch (error) { next(error); }
});

uploadsRouter.post('/lesson-pdf', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const baseUrl = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
    res.json({
      url: `${baseUrl}/api/uploads/lesson-pdfs/${req.file.filename}`,
      filename: req.file.originalname
    });
  } catch (error) { next(error); }
});
