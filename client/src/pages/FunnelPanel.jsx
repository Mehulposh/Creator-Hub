import { useEffect, useState } from 'react';
import { GitBranch, Plus, Trash2, X } from 'lucide-react';
import { funnelApi } from '../lib/api';
import { useTheme, ui } from '../lib/ui';
import { SectionHead, LoadingBlock, EmptyBlock, ModalShell, FormField, StatusPill } from '../components/ui';
import { cn } from '../lib/cn';

export function FunnelPanel() {
  const isDark = useTheme();
  const [funnels, setFunnels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', slug: '', status: 'draft', steps: [{ name: 'Landing page', type: 'landing', content: '' }] });
  const [error, setError] = useState('');

  useEffect(() => {
    funnelApi.list().then(setFunnels).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const funnel = await funnelApi.create(form);
      setFunnels([funnel, ...funnels]);
      setOpen(false);
    } catch (err) { setError(err.message); }
  };

  const publish = async (funnel) => {
    const updated = await funnelApi.update(funnel._id, { status: funnel.status === 'published' ? 'draft' : 'published' });
    setFunnels(funnels.map((f) => f._id === updated._id ? updated : f));
  };

  const remove = async (id) => {
    await funnelApi.remove(id);
    setFunnels(funnels.filter((f) => f._id !== id));
  };

  return (
    <section className={ui.page}>
      <SectionHead
        eyebrow="SALES FUNNELS"
        title="Funnel builder"
        description="Create landing pages, lead capture, and checkout flows."
        isDark={isDark}
        action={
          <button type="button" className={ui.primary} onClick={() => setOpen(true)}>
            <Plus size={18}/>New funnel
          </button>
        }
      />
      {error && <p className={ui.formError}>{error}</p>}
      {loading ? (
        <LoadingBlock text="Loading funnels..." isDark={isDark}/>
      ) : !funnels.length ? (
        <EmptyBlock
          icon={<GitBranch size={25}/>}
          title="Build your first funnel"
          description="Create multi-step sales flows with landing pages and conversions."
          isDark={isDark}
        />
      ) : (
        <div className="grid grid-cols-3 gap-4 max-[800px]:grid-cols-2 max-[550px]:grid-cols-1">
          {funnels.map((funnel) => (
            <article className={cn(ui.card(isDark), 'p-[18px]')} key={funnel._id}>
              <div className="flex items-center justify-between">
                <StatusPill status={funnel.status}/>
                <small className={cn('text-[10px]', ui.muted(isDark))}>{funnel.steps.length} steps</small>
              </div>
              <h3 className={cn('mt-5 font-display text-sm font-semibold', ui.h3)}>{funnel.name}</h3>
              <p className={cn('mt-1 h-[33px] text-[11px] leading-relaxed', ui.muted(isDark))}>{funnel.description || 'No description'}</p>
              <div className={cn(
                'mt-5 flex items-center justify-between border-t pt-3 text-[10px]',
                isDark ? 'border-violet-300/10 text-[#aaa4b9]' : 'border-violet-200/15 text-[#817b94]'
              )}>
                <span>{funnel.visits} visits · {funnel.conversions} conversions</span>
                <div className="flex items-center gap-2">
                  {funnel.slug && funnel.status === 'published' && (
                    <a href={`/f/${funnel.slug}`} target="_blank" rel="noreferrer" className="text-violet-400 no-underline">View</a>
                  )}
                  <button type="button" className="cursor-pointer border-0 bg-transparent text-emerald-400" onClick={() => publish(funnel)}>
                    {funnel.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button type="button" className="cursor-pointer border-0 bg-transparent text-violet-300" onClick={() => remove(funnel._id)}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {open && (
        <ModalShell isDark={isDark} onClose={() => setOpen(false)}>
          <button type="button" className={ui.closeBtn(isDark)} onClick={() => setOpen(false)}><X size={19}/></button>
          <form onSubmit={submit}>
            <h2 className={ui.h2}>Create funnel</h2>
            <FormField label="Name" isDark={isDark}>
              <input required className={ui.input(isDark)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/>
            </FormField>
            <FormField label="Description" isDark={isDark}>
              <textarea className={ui.textarea(isDark)} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/>
            </FormField>
            <FormField label="Public URL slug" isDark={isDark}>
              <input required className={ui.input(isDark)} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="my-launch-funnel"/>
              <small className={cn('mt-1 block text-[10px]', ui.muted(isDark))}>/f/{form.slug || 'your-slug'}</small>
            </FormField>
            <FormField label="First step name" isDark={isDark}>
              <input required className={ui.input(isDark)} value={form.steps[0].name} onChange={(e) => setForm({ ...form, steps: [{ ...form.steps[0], name: e.target.value }] })}/>
            </FormField>
            <button type="submit" className={cn(ui.primary, ui.wide)}>Create funnel</button>
          </form>
        </ModalShell>
      )}
    </section>
  );
}
