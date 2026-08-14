import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Zap } from 'lucide-react';
import { automationApi } from '../lib/api';
import { useTheme, ui } from '../lib/ui';
import { SectionHead, LoadingBlock, EmptyBlock, ModalShell, FormField, StatusPill } from '../components/ui';
import { cn } from '../lib/cn';

const triggers = [
  { id: 'new_sale', label: 'New sale' },
  { id: 'new_customer', label: 'New customer' },
  { id: 'new_subscriber', label: 'New subscriber' },
  { id: 'booking_confirmed', label: 'Booking confirmed' }
];

const actions = [
  { id: 'send_email', label: 'Send email' },
  { id: 'add_tag', label: 'Add CRM tag' },
  { id: 'notify', label: 'Notify me' }
];

const empty = { name: '', trigger: 'new_sale', action: 'send_email', template: '', active: true };

export function AutomationPanel() {
  const isDark = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  const load = () => automationApi.list().then(setItems).catch((e) => setError(e.message)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const created = await automationApi.create(form);
      setItems([created, ...items]);
      setOpen(false);
      setForm(empty);
    } catch (err) { setError(err.message); }
  };

  const toggle = async (item) => {
    const updated = await automationApi.update(item._id, { active: !item.active });
    setItems(items.map((a) => a._id === updated._id ? updated : a));
  };

  const remove = async (id) => {
    await automationApi.remove(id);
    setItems(items.filter((a) => a._id !== id));
  };

  return (
    <section className={ui.page}>
      <SectionHead
        eyebrow="AI AUTOMATION"
        title="Automation workflows"
        description="Automate welcome emails, tags, and notifications when events happen."
        isDark={isDark}
        action={
          <button type="button" className={ui.primary} onClick={() => setOpen(true)}>
            <Plus size={18}/>New automation
          </button>
        }
      />
      {error && <p className={ui.formError}>{error}</p>}
      {loading ? (
        <LoadingBlock text="Loading automations..." isDark={isDark}/>
      ) : !items.length ? (
        <EmptyBlock icon={<Zap size={25}/>} title="No automations yet" description="Create workflows for sales, bookings, and subscribers." isDark={isDark}/>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <article className={cn(ui.card(isDark), 'flex items-center justify-between gap-4 p-4')} key={item._id}>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={cn('font-display text-sm font-semibold', ui.h3)}>{item.name}</h3>
                  <StatusPill status={item.active ? 'published' : 'draft'}/>
                </div>
                <p className={cn('mt-1 text-[11px]', ui.muted(isDark))}>
                  When <b>{triggers.find((t) => t.id === item.trigger)?.label || item.trigger}</b> → {actions.find((a) => a.id === item.action)?.label || item.action}
                  {item.runs > 0 && <> · {item.runs} runs</>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className={ui.secondary(isDark)} onClick={() => toggle(item)}>{item.active ? 'Pause' : 'Activate'}</button>
                <button type="button" className="border-0 bg-transparent text-rose-300" onClick={() => remove(item._id)}><Trash2 size={16}/></button>
              </div>
            </article>
          ))}
        </div>
      )}
      {open && (
        <ModalShell isDark={isDark} onClose={() => setOpen(false)}>
          <button type="button" className={ui.closeBtn(isDark)} onClick={() => setOpen(false)}><X size={19}/></button>
          <form onSubmit={submit}>
            <p className={ui.eyebrow}>NEW AUTOMATION</p>
            <h2 className={ui.h2}>Create workflow</h2>
            <FormField label="Name" isDark={isDark}>
              <input required className={ui.input(isDark)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Welcome new customers"/>
            </FormField>
            <FormField label="Trigger" isDark={isDark}>
              <select className={ui.input(isDark)} value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })}>
                {triggers.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </FormField>
            <FormField label="Action" isDark={isDark}>
              <select className={ui.input(isDark)} value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
                {actions.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </FormField>
            <FormField label={form.action === 'add_tag' ? 'Tag name' : 'Email / message template (HTML)'} isDark={isDark}>
              <textarea className={ui.textarea(isDark)} value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })} rows={5} placeholder={form.action === 'add_tag' ? 'vip-customer' : '<p>Thanks for your purchase!</p>'}/>
            </FormField>
            <button type="submit" className={cn(ui.primary, ui.wide)}>Create automation</button>
          </form>
        </ModalShell>
      )}
    </section>
  );
}
