import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { KnowledgeDocument } from '../models/KnowledgeDocument.js';
import { chunkText } from '../services/rag.js';
import { extractPdfText } from '../services/pdf.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads/knowledge-pdfs');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

export const knowledgeRouter = Router();
const schema = z.object({ title: z.string().min(2).max(160), content: z.string().min(20).max(50000) });

knowledgeRouter.use(requireAuth, requireCreator);

knowledgeRouter.get('/', async (req, res, next) => {
  try {
    res.json(await KnowledgeDocument.find({ creator: req.auth.sub })
      .select('title status chunks sourceType pdfFilename createdAt')
      .sort({ createdAt: -1 }));
  } catch (error) { next(error); }
});

knowledgeRouter.post('/', async (req, res, next) => {
  try {
    const input = schema.parse(req.body);
    const document = await KnowledgeDocument.create({
      ...input,
      sourceType: 'text',
      chunks: chunkText(input.content),
      creator: req.auth.sub
    });
    res.status(201).json(document);
  } catch (error) { next(error); }
});

knowledgeRouter.post('/from-pdf', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded' });
    const title = z.string().min(2).max(160).parse(req.body.title || req.file.originalname.replace(/\.pdf$/i, ''));
    const extracted = (await extractPdfText(req.file.path)).replace(/\s+/g, ' ').trim();
    if (extracted.length < 20) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Could not extract enough text from this PDF. Try a text-based PDF or paste the content manually.' });
    }
    const content = extracted.slice(0, 50000);
    const baseUrl = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
    const document = await KnowledgeDocument.create({
      title,
      content,
      sourceType: 'pdf',
      pdfUrl: `${baseUrl}/api/uploads/knowledge-pdfs/${req.file.filename}`,
      pdfFilename: req.file.originalname,
      chunks: chunkText(content),
      creator: req.auth.sub
    });
    res.status(201).json(document);
  } catch (error) { next(error); }
});

knowledgeRouter.delete('/:id', async (req, res, next) => {
  try {
    const document = await KnowledgeDocument.findOneAndDelete({ _id: req.params.id, creator: req.auth.sub });
    if (!document) return res.status(404).json({ message: 'Knowledge document not found' });
    res.status(204).end();
  } catch (error) { next(error); }
});
