import { useEffect, useState } from 'react';
import { Bot, Compass, FileText, Link2, LoaderCircle, Plus, Send, Sparkles, Trash2, X, Zap } from 'lucide-react';
import { aiGeneratorApi, aiStudioApi, knowledgeApi, settingsApi, productApi } from '../lib/api';
import { useTheme, ui } from '../lib/ui';
import { SectionHead, LoadingBlock, ModalShell, FormField } from '../components/ui';
import { cn } from '../lib/cn';

const agents = [
  { id: 'content', label: 'Content Agent', text: 'Turn ideas into creator-ready content.' },
  { id: 'marketing', label: 'Marketing Agent', text: 'Plan campaigns that create momentum.' },
  { id: 'sales', label: 'Sales Agent', text: 'Sharpen your offer and conversion copy.' },
  { id: 'support', label: 'Support Agent', text: 'Answer questions from your knowledge base.' },
  { id: 'analytics', label: 'Analytics Agent', text: 'Find the story behind your numbers.' },
  { id: 'advisor', label: 'Business Advisor', text: 'Choose your smartest next move.' }
];

export function AiPanel({ view }) {
  const isDark = useTheme();
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [agent, setAgent] = useState('content');
  const [conversationId, setConversationId] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [doc, setDoc] = useState({ title: '', content: '' });
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [genResult, setGenResult] = useState('');
  const [genHtml, setGenHtml] = useState('');
  const [contentType, setContentType] = useState('blog');
  const [structured, setStructured] = useState(null);

  const loadKnowledge = async () => {
    try { setLoading(true); setDocuments(await knowledgeApi.list()); } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { if (view === 'Knowledge') loadKnowledge(); }, [view]);

  const ask = async (event) => {
    event.preventDefault();
    if (!prompt.trim()) return;
    const question = prompt;
    setPrompt('');
    setMessages([...messages, { role: 'user', content: question }]);
    try {
      setLoading(true);
      const response = view === 'Support' ? await aiStudioApi.support({ message: question, conversationId }) : await aiStudioApi.agent({ message: question, conversationId, agent });
      setConversationId(response.conversationId);
      setMessages((items) => [...items, { role: 'assistant', ...response }]);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError('');
    try {
      const api = { 'AI Product': aiGeneratorApi.product, 'AI Website': aiGeneratorApi.website, 'AI Branding': aiGeneratorApi.branding, 'AI Content': aiGeneratorApi.content }[view];
      const result = await api({ prompt, contentType: view === 'AI Content' ? contentType : undefined });
      setGenResult(result.structured ? JSON.stringify(result.structured, null, 2) : result.content);
      setStructured(result.structured || null);
      setGenHtml(result.html || '');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const resetDocForm = () => {
    setDoc({ title: '', content: '' });
    setPdfFile(null);
    setOpen(false);
  };

  const addDocument = async (event) => {
    event.preventDefault();
    try {
      setPdfUploading(true);
      setError('');
      const created = pdfFile
        ? await knowledgeApi.createFromPdf(doc.title, pdfFile)
        : await knowledgeApi.create(doc);
      setDocuments([created, ...documents]);
      resetDocForm();
    } catch (e) { setError(e.message); } finally { setPdfUploading(false); }
  };
  const remove = async (id) => { await knowledgeApi.remove(id); setDocuments(documents.filter((item) => item._id !== id)); };

  if (view === 'Knowledge') {
    return (
      <section className={ui.page}>
        <SectionHead
          isDark={isDark}
          eyebrow="RAG KNOWLEDGE BASE"
          title="Knowledge base"
          action={<button className={ui.primary} onClick={() => setOpen(true)}><Plus size={18}/>Add knowledge</button>}
        />
        {error && <p className={ui.formError}>{error}</p>}
        {loading ? <LoadingBlock isDark={isDark} text="Loading knowledge..." /> : (
          <div className="grid max-w-[900px] grid-cols-2 gap-3.5 max-[700px]:grid-cols-1">
            {documents.map((item) => (
              <article className={cn('flex items-center gap-3 p-4', ui.card(isDark))} key={item._id}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/12 text-[#b79fff]"><FileText size={21}/></span>
                <div className="flex-1">
                  <h3 className={cn(ui.h3, 'mb-1 text-[13px]')}>{item.title}</h3>
                  <p className={cn('text-[10px]', ui.muted(isDark))}>
                    {item.chunks.length} chunks
                    {item.sourceType === 'pdf' && <> · <span className="text-emerald-400">PDF{item.pdfFilename ? `: ${item.pdfFilename}` : ''}</span></>}
                  </p>
                </div>
                <button className="border-0 bg-transparent text-rose-300" onClick={() => remove(item._id)}><Trash2 size={16}/></button>
              </article>
            ))}
          </div>
        )}
        {open && (
          <ModalShell isDark={isDark} onClose={resetDocForm}>
            <button type="button" className={ui.closeBtn(isDark)} onClick={resetDocForm}><X size={19}/></button>
            <form onSubmit={addDocument}>
              <p className={ui.eyebrow}>ADD KNOWLEDGE</p>
              <h2 className={ui.h2}>Add to knowledge base</h2>
              <FormField label="Title" isDark={isDark}>
                <input required className={ui.input(isDark)} value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} placeholder="Refund policy"/>
              </FormField>
              <FormField label="Upload PDF" isDark={isDark}>
                <input
                  type="file"
                  accept="application/pdf"
                  className={ui.input(isDark)}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setPdfFile(file);
                    if (file) {
                      setDoc((prev) => ({
                        ...prev,
                        title: prev.title.trim() ? prev.title : file.name.replace(/\.pdf$/i, '')
                      }));
                    }
                  }}
                />
                {pdfFile && (
                  <p className={cn('mt-1.5 inline-flex items-center gap-1.5 text-xs text-emerald-400', ui.muted(isDark))}>
                    <FileText size={14}/> {pdfFile.name}
                  </p>
                )}
              </FormField>
              <FormField label="Or paste content" isDark={isDark}>
                <textarea
                  className={ui.textarea(isDark)}
                  value={doc.content}
                  onChange={(e) => setDoc({ ...doc, content: e.target.value })}
                  placeholder="Paste text content here if not uploading a PDF..."
                  rows={6}
                  required={!pdfFile}
                  disabled={Boolean(pdfFile)}
                />
              </FormField>
              <button className={cn(ui.primary, ui.wide)} disabled={pdfUploading || (!pdfFile && doc.content.trim().length < 20)}>
                {pdfUploading ? 'Processing PDF...' : pdfFile ? 'Upload PDF' : 'Add text'}
              </button>
            </form>
          </ModalShell>
        )}
      </section>
    );
  }

  if (['AI Product', 'AI Website', 'AI Branding', 'AI Content'].includes(view)) {
    const icons = { 'AI Product': Zap, 'AI Website': Link2, 'AI Branding': Compass, 'AI Content': FileText };
    const Icon = icons[view];
    const contentTypes = [
      { id: 'blog', label: 'Blog post' }, { id: 'social', label: 'Social media' },
      { id: 'email', label: 'Email' }, { id: 'landing', label: 'Landing page' },
      { id: 'sales', label: 'Sales copy' }, { id: 'course', label: 'Course outline' }, { id: 'script', label: 'Script' }
    ];
    return (
      <section className={ui.page}>
        <SectionHead
          isDark={isDark}
          eyebrow="AI GENERATORS"
          title={view}
          description="Describe what you want and let AI generate it for you."
        />
        <article className={cn('flex min-h-[480px] flex-col overflow-hidden p-0', ui.card(isDark))}>
          <div className={cn('flex items-center gap-2.5 px-[18px] py-4', isDark ? 'border-b border-violet-300/10' : 'border-b border-violet-200/15')}>
            <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-violet-500/11 text-[#b79fff]"><Icon size={18}/></span>
            <div><b className="text-xs">{view}</b></div>
          </div>
          {view === 'AI Content' && (
            <div className="flex flex-wrap gap-2 px-[18px] py-3">
              {contentTypes.map((t) => (
                <button key={t.id} type="button" className={cn('rounded-full px-3 py-1 text-[10px] font-semibold', contentType === t.id ? 'bg-violet-500 text-white' : ui.secondary(isDark))} onClick={() => setContentType(t.id)}>{t.label}</button>
              ))}
            </div>
          )}
          <form className={cn('flex gap-2 p-[11px]', isDark ? 'border-t border-violet-300/10' : 'border-t border-violet-200/15')} onSubmit={(e) => { e.preventDefault(); generate(); }}>
            <input
              className={cn('flex-1 border-0 bg-transparent px-2 py-2 text-xs outline-none', isDark ? 'text-[#f4f1fb]' : 'text-[#28243b]')}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Describe your ${view.replace('AI ', '').toLowerCase()}...`}
            />
            <button className={cn(ui.primary, 'px-2.5 py-2')} disabled={loading}><Sparkles size={16}/></button>
          </form>
          {loading && (
            <div className={cn('flex items-center gap-1.5 px-3 py-2 text-[11px]', ui.muted(isDark))}>
              <LoaderCircle className="animate-spin" size={15}/>Generating...
            </div>
          )}
          {genResult && (
            <pre className={cn('mx-3 mb-3 max-h-[300px] overflow-auto whitespace-pre-wrap rounded-[10px] border p-3.5 text-[11px]', isDark ? 'border-violet-300/10 bg-violet-500/6' : 'border-violet-200/15 bg-violet-500/6')}>{genResult}</pre>
          )}
          {genHtml && (
            <iframe title="preview" className={cn('mx-3 mb-3 h-[400px] w-[calc(100%-24px)] rounded-[10px] border bg-white', isDark ? 'border-violet-300/10' : 'border-violet-200/15')} srcDoc={genHtml}/>
          )}
          {view === 'AI Branding' && structured && (
            <button type="button" className={cn(ui.secondary(isDark), 'mx-3 mb-3')} onClick={async () => {
              try { await settingsApi.applyBranding(structured); setError(''); alert('Branding applied to your storefront!'); } catch (e) { setError(e.message); }
            }}>Apply to storefront</button>
          )}
          {view === 'AI Product' && structured && (
            <button type="button" className={cn(ui.secondary(isDark), 'mx-3 mb-3')} onClick={async () => {
              try {
                await productApi.create({ title: structured.title, description: structured.description, price: structured.pricingSuggestion || 29, status: 'draft', type: 'digital_download' });
                alert('Product draft created!');
              } catch (e) { setError(e.message); }
            }}>Create product from output</button>
          )}
        </article>
        {error && <p className={ui.formError}>{error}</p>}
      </section>
    );
  }

  const selected = agents.find((item) => item.id === agent);
  return (
    <section className={cn(ui.page, 'max-w-[940px]')}>
      <SectionHead
        isDark={isDark}
        eyebrow="AI-POWERED STUDIO"
        title={view === 'Support' ? 'Support copilot' : 'AI Studio'}
      />
      {view !== 'Support' && (
        <div className="mb-4 grid grid-cols-3 gap-2 max-[700px]:grid-cols-2 max-[450px]:grid-cols-1">
          {agents.map((item) => (
            <button
              className={cn(
                'flex items-start gap-2 rounded-xl border p-[11px] text-left',
                item.id === agent
                  ? 'border-violet-400 bg-violet-500/8 shadow-[0_0_0_1px_#a98aff45]'
                  : isDark ? 'border-violet-300/10 bg-violet-950/40 text-[#f4f1fb]' : 'border-violet-200/15 bg-white/70 text-[#28243b]'
              )}
              key={item.id}
              onClick={() => { setAgent(item.id); setMessages([]); setConversationId(); }}
            >
              <Sparkles size={15} className="shrink-0 text-[#b79fff]"/>
              <span>
                <b className="block text-[11px]">{item.label}</b>
                <small className={cn('mt-0.5 block text-[9px] leading-snug', ui.muted(isDark))}>{item.text}</small>
              </span>
            </button>
          ))}
        </div>
      )}
      <article className={cn('flex min-h-[480px] flex-col overflow-hidden p-0', ui.card(isDark))}>
        <div className={cn('flex items-center gap-2.5 px-[18px] py-4', isDark ? 'border-b border-violet-300/10' : 'border-b border-violet-200/15')}>
          <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-violet-500/11 text-[#b79fff]"><Bot size={18}/></span>
          <div><b className="text-xs">{view === 'Support' ? 'Customer support assistant' : selected.label}</b></div>
        </div>
        <div className="flex min-h-[330px] flex-1 flex-col gap-[13px] p-5">
          {!messages.length && (
            <div className={cn('m-auto max-w-[270px] text-center text-xs leading-relaxed', ui.muted(isDark))}>
              <Sparkles size={23} className="mx-auto mb-2 text-[#b79fff]"/>
              <p>Ask anything about your creator business.</p>
            </div>
          )}
          {messages.map((item, index) => (
            <div
              className={cn(
                'max-w-[78%] rounded-xl px-3 py-2.5 text-xs leading-relaxed max-[450px]:max-w-[90%]',
                item.role === 'user'
                  ? 'self-end rounded-br-[3px] bg-[#8b67e9] text-white'
                  : cn('self-start rounded-bl-[3px] border', isDark ? 'border-violet-300/10 bg-violet-500/8' : 'border-violet-200/15 bg-violet-500/8')
              )}
              key={index}
            >
              <p className="m-0 whitespace-pre-wrap">{item.content}</p>
              {item.sources?.length > 0 && <small className="mt-1.5 block text-[9px] text-[#bdaeff]">Sources: {item.sources.join(', ')}</small>}
            </div>
          ))}
          {loading && (
            <div className={cn('flex items-center gap-1.5 text-[11px]', ui.muted(isDark))}>
              <LoaderCircle className="animate-spin" size={15}/>AI is thinking...
            </div>
          )}
        </div>
        <form className={cn('flex gap-2 p-[11px]', isDark ? 'border-t border-violet-300/10' : 'border-t border-violet-200/15')} onSubmit={ask}>
          <input
            className={cn('flex-1 border-0 bg-transparent px-2 py-2 text-xs outline-none', isDark ? 'text-[#f4f1fb]' : 'text-[#28243b]')}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to create..."
          />
          <button className={cn(ui.primary, 'px-2.5 py-2')}><Send size={16}/></button>
        </form>
      </article>
      {error && <p className={ui.formError}>{error}</p>}
    </section>
  );
}
