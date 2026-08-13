import { useEffect, useState } from 'react';
import { CheckCircle2, Link2, Plus, Store, Trash2, UserRound } from 'lucide-react';
import { settingsApi } from '../lib/api';
import { useTheme, ui } from '../lib/ui';
import { SectionHead, LoadingBlock, FormField } from '../components/ui';
import { cn } from '../lib/cn';

export function SettingsPanel({ onUpdated }) {
  const isDark = useTheme();
  const [form, setForm] = useState({
    name: '', storeName: '', storeSlug: '', bio: '', themeColor: '#8b5cf6',
    socialLinks: { instagram: '', twitter: '', youtube: '', tiktok: '', website: '' },
    linkBlocks: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    settingsApi.profile().then((profile) => setForm({
      name: profile.name || '', storeName: profile.storeName || '', storeSlug: profile.storeSlug || '',
      bio: profile.bio || '', themeColor: profile.themeColor || '#8b5cf6',
      socialLinks: { instagram: '', twitter: '', youtube: '', tiktok: '', website: '', ...profile.socialLinks },
      linkBlocks: profile.linkBlocks || []
    })).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const save = async (event) => {
    event.preventDefault();
    try {
      setSaving(true); setError('');
      const profile = await settingsApi.update({ ...form, storeSlug: form.storeSlug.trim().toLowerCase() });
      onUpdated(profile);
      setMessage('Settings saved. Your storefront is ready to share.');
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const addLink = () => setForm({ ...form, linkBlocks: [...form.linkBlocks, { label: 'New link', url: 'https://', order: form.linkBlocks.length }] });
  const updateLink = (i, key, val) => {
    const blocks = [...form.linkBlocks];
    blocks[i] = { ...blocks[i], [key]: val };
    setForm({ ...form, linkBlocks: blocks });
  };
  const removeLink = (i) => setForm({ ...form, linkBlocks: form.linkBlocks.filter((_, idx) => idx !== i) });

  if (loading) return <LoadingBlock isDark={isDark} text="Loading settings..."/>;

  return (
    <section className={cn(ui.page, 'max-w-[760px]')}>
      <SectionHead
        isDark={isDark}
        eyebrow="ACCOUNT & STOREFRONT"
        title="Settings"
        description="Customize your link-in-bio storefront and creator profile."
      />
      <form className={cn('grid gap-4 p-[23px] max-[500px]:p-4', ui.card(isDark))} onSubmit={save}>
        <section className={cn('mt-1.5 flex items-center gap-[11px] border-b pb-3.5', isDark ? 'border-violet-300/10' : 'border-violet-200/15')}>
          <div className="grid h-[37px] w-[37px] place-items-center rounded-[11px] bg-violet-500/11 text-[#b79fff]"><UserRound size={19}/></div>
          <div><h3 className={ui.h3}>Creator profile</h3></div>
        </section>
        <FormField label="Your name" isDark={isDark}>
          <input required className={ui.input(isDark)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/>
        </FormField>
        <FormField label="Bio" isDark={isDark}>
          <textarea className={ui.textarea(isDark)} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell visitors about yourself..." maxLength={500}/>
        </FormField>

        <section className={cn('mt-1.5 flex items-center gap-[11px] border-b pb-3.5', isDark ? 'border-violet-300/10' : 'border-violet-200/15')}>
          <div className="grid h-[37px] w-[37px] place-items-center rounded-[11px] bg-violet-500/11 text-[#b79fff]"><Store size={19}/></div>
          <div><h3 className={ui.h3}>Public storefront</h3></div>
        </section>
        <FormField label="Store name" isDark={isDark}>
          <input required className={ui.input(isDark)} value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })}/>
        </FormField>
        <FormField label="Store URL slug" isDark={isDark}>
          <input required className={ui.input(isDark)} value={form.storeSlug} onChange={(e) => setForm({ ...form, storeSlug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}/>
          <small className={cn('mt-1.5 block text-[10px] font-normal', ui.muted(isDark))}>creatorhub.com/store/{form.storeSlug || 'your-store'}</small>
        </FormField>
        <FormField label="Theme color" isDark={isDark}>
          <input className={cn(ui.input(isDark), 'h-10 cursor-pointer p-1')} type="color" value={form.themeColor} onChange={(e) => setForm({ ...form, themeColor: e.target.value })}/>
        </FormField>

        <section className={cn('mt-1.5 flex items-center gap-[11px] border-b pb-3.5', isDark ? 'border-violet-300/10' : 'border-violet-200/15')}>
          <div className="grid h-[37px] w-[37px] place-items-center rounded-[11px] bg-violet-500/11 text-[#b79fff]"><Link2 size={19}/></div>
          <div>
            <h3 className={ui.h3}>Link-in-bio blocks</h3>
            <p className={cn('text-[10px]', ui.muted(isDark))}>Add custom links to your public page.</p>
          </div>
        </section>
        {form.linkBlocks.map((block, i) => (
          <div className={ui.formRow} key={i}>
            <FormField label="Label" isDark={isDark}>
              <input className={ui.input(isDark)} value={block.label} onChange={(e) => updateLink(i, 'label', e.target.value)}/>
            </FormField>
            <div className="flex items-end gap-2">
              <FormField label="URL" isDark={isDark}>
                <input className={ui.input(isDark)} value={block.url} onChange={(e) => updateLink(i, 'url', e.target.value)}/>
              </FormField>
              <button type="button" className={cn('mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border-0 bg-rose-400/10 text-rose-300')} onClick={() => removeLink(i)}><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
        <button type="button" className={ui.secondary(isDark)} onClick={addLink}><Plus size={14}/> Add link</button>

        <section className={cn('mt-1.5 border-b pb-3.5', isDark ? 'border-violet-300/10' : 'border-violet-200/15')}>
          <h3 className={ui.h3}>Social links</h3>
        </section>
        {['instagram', 'twitter', 'youtube', 'tiktok', 'website'].map((key) => (
          <FormField key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} isDark={isDark}>
            <input className={ui.input(isDark)} value={form.socialLinks[key] || ''} onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, [key]: e.target.value } })}/>
          </FormField>
        ))}

        {error && <p className={ui.formError}>{error}</p>}
        {message && (
          <p className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <CheckCircle2 size={15}/>{message}
          </p>
        )}
        <button className={cn(ui.primary, 'w-max')} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
      </form>
    </section>
  );
}
