import { KnowledgeDocument } from '../models/KnowledgeDocument.js';

export function chunkText(content) {
  const words = content.replace(/\s+/g, ' ').trim().split(' '); const size = 180; const overlap = 30; const chunks = [];
  for (let start = 0; start < words.length; start += size - overlap) chunks.push({ index: chunks.length, content: words.slice(start, start + size).join(' ') });
  return chunks.filter((chunk) => chunk.content.length);
}
export async function retrieve(creator, query) {
  const terms = [...new Set(query.toLowerCase().match(/[a-z0-9]{3,}/g) || [])];
  const documents = await KnowledgeDocument.find({ creator, status: 'ready' }).select('title chunks');
  return documents.flatMap((document) => document.chunks.map((chunk) => ({ title: document.title, content: chunk.content, score: terms.reduce((score, term) => score + (chunk.content.toLowerCase().match(new RegExp(term, 'g')) || []).length, 0) }))).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 4);
}
