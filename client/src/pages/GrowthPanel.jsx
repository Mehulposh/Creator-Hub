import { useEffect, useState } from 'react';
import { BarChart3, CalendarPlus, MailPlus, Plus, Send, UserPlus, X } from 'lucide-react';
import { analyticsApi, appointmentApi, campaignApi, contactApi } from '../lib/api';
import { useTheme, ui } from '../lib/ui';
import { SectionHead, LoadingBlock, EmptyBlock, ModalShell, FormField, StatusPill } from '../components/ui';
import { cn } from '../lib/cn';

const config = {
  Customers: { title: 'Your audience', text: 'Build stronger relationships with every subscriber and customer.', action: 'Add contact', icon: UserPlus },
  Bookings: { title: 'Bookings', text: 'Manage upcoming calls, coaching sessions, and events.', action: 'Add booking', icon: CalendarPlus },
  Campaigns: { title: 'Email campaigns', text: 'Write, send, and measure messages that move your audience.', action: 'New campaign', icon: MailPlus },
  Analytics: { title: 'Business analytics', text: 'A clear view of the signals that matter to your creator business.', action: null, icon: BarChart3 }
};

const initial = { name: '', email: '', status: 'lead', tags: '', clientName: '', clientEmail: '', title: '', startsAt: '', duration: '60', joinLink: '', subject: '', content: '', audience: 'all' };

const tableCols = 'grid-cols-[2fr_1fr_1.6fr_0.8fr] max-[800px]:grid-cols-[1.6fr_0.8fr_1fr]';

export function GrowthPanel({ view }) {
  const isDark = useTheme();
  const [items, setItems] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmLink, setConfirmLink] = useState('');
  const details = config[view];

  const load = async () => {
    try {
      setLoading(true); setError('');
      if (view === 'Customers') setItems(await contactApi.list());
      else if (view === 'Bookings') setItems(await appointmentApi.list());
      else if (view === 'Campaigns') setItems(await campaignApi.list());
      else setAnalytics(await analyticsApi.overview());
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { setItems([]); setAnalytics(null); load(); }, [view]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      let item;
      if (view === 'Customers') item = await contactApi.create({ name: form.name, email: form.email, status: form.status, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean) });
      if (view === 'Bookings') item = await appointmentApi.create({ clientName: form.clientName, clientEmail: form.clientEmail, title: form.title, startsAt: form.startsAt, duration: Number(form.duration), joinLink: form.joinLink || undefined });
      if (view === 'Campaigns') item = await campaignApi.create({ name: form.name, subject: form.subject, content: form.content, audience: form.audience });
      setItems([item, ...items]);
      setOpen(false);
      setForm(initial);
    } catch (e) { setError(e.message); }
  };

  const send = async (campaign) => {
    try {
      const updated = await campaignApi.send(campaign._id);
      setItems(items.map((item) => item._id === updated._id ? updated : item));
    } catch (e) { setError(e.message); }
  };

  const updateJoinLink = async (id, current) => {
    const link = window.prompt('Meeting join link (Google Meet, Zoom, etc.)', current || '');
    if (link === null) return;
    try {
      const updated = await appointmentApi.update(id, { joinLink: link });
      setItems(items.map((item) => item._id === updated._id ? updated : item));
    } catch (e) { setError(e.message); }
  };

  const openConfirm = (item) => {
    setConfirmTarget(item);
    setConfirmLink(item.joinLink || '');
    setConfirmOpen(true);
  };

  const confirmSession = async (e) => {
    e.preventDefault();
    if (!confirmLink.trim()) return;
    try {
      const updated = await appointmentApi.confirm(confirmTarget._id, confirmLink.trim());
      setItems(items.map((item) => item._id === updated._id ? updated : item));
      setConfirmOpen(false);
      setConfirmTarget(null);
      setConfirmLink('');
    } catch (e) { setError(e.message); }
  };

  return (
    <section className={ui.page}>
      <SectionHead
        eyebrow="GROWTH TOOLS"
        title={details.title}
        description={details.text}
        isDark={isDark}
        action={details.action && (
          <button type="button" className={ui.primary} onClick={() => setOpen(true)}>
            <Plus size={18}/>{details.action}
          </button>
        )}
      />
      {error && <p className={ui.formError}>{error}</p>}
      {loading ? (
        <LoadingBlock text="Loading workspace..." isDark={isDark}/>
      ) : view === 'Analytics' ? (
        <Analytics data={analytics} isDark={isDark}/>
      ) : (
        <List view={view} items={items} isDark={isDark} onSend={send} onOpen={() => setOpen(true)} onUpdateJoinLink={updateJoinLink} onConfirm={openConfirm}/>
      )}
      {open && <CreateModal view={view} form={form} setForm={setForm} submit={submit} close={() => setOpen(false)} isDark={isDark}/>}
      {confirmOpen && (
        <ModalShell isDark={isDark} onClose={() => setConfirmOpen(false)}>
          <button type="button" className={ui.closeBtn(isDark)} onClick={() => setConfirmOpen(false)}><X size={19}/></button>
          <form onSubmit={confirmSession}>
            <p className={ui.eyebrow}>CONFIRM SESSION</p>
            <h2 className={ui.h2}>Send meeting link</h2>
            <p className={cn('mb-4 text-xs', ui.muted(isDark))}>
              Confirm {confirmTarget?.clientName}&apos;s session on {confirmTarget && new Date(confirmTarget.startsAt).toLocaleString()}. The customer will be notified by email.
            </p>
            <FormField label="Google Meet / Zoom link" isDark={isDark}>
              <input required type="url" className={ui.input(isDark)} value={confirmLink} onChange={(e) => setConfirmLink(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij"/>
            </FormField>
            <button type="submit" className={cn(ui.primary, ui.wide)}>Confirm & notify customer</button>
          </form>
        </ModalShell>
      )}
    </section>
  );
}

function List({ view, items, isDark, onSend, onOpen, onUpdateJoinLink, onConfirm }) {
  if (!items.length) {
    return (
      <EmptyBlock
        icon={<Plus size={24}/>}
        title={`Your ${view.toLowerCase()} workspace is ready`}
        description="Create your first entry to start making this part of your business work for you."
        isDark={isDark}
        action={<button type="button" className={ui.primary} onClick={onOpen}>Create first entry</button>}
      />
    );
  }

  if (view === 'Customers') {
    return (
      <div className={ui.tableCard(isDark)}>
        <div className={cn('grid gap-3 border-b px-5 py-3.5 text-[10px] font-bold uppercase tracking-wide', tableCols, isDark ? 'border-violet-300/10 text-[#aaa4b9]' : 'border-violet-200/15 text-[#817b94]')}>
          <span>Contact</span><span>Stage</span><span className="max-[800px]:hidden">Tags</span><span className="max-[550px]:hidden">Added</span>
        </div>
        {items.map((item) => (
          <div className={cn('grid items-center gap-3 border-b px-5 py-3.5 text-xs last:border-0', tableCols, isDark ? 'border-violet-300/10' : 'border-violet-200/15')} key={item._id}>
            <div>
              <b className="block">{item.name}</b>
              <small className={cn('mt-0.5 block text-[10px]', ui.muted(isDark))}>{item.email}</small>
            </div>
            <StatusPill status={item.status}/>
            <span className="flex flex-wrap gap-1 max-[800px]:hidden">
              {item.tags?.length ? item.tags.map((tag) => (
                <i key={tag} className="rounded-[5px] bg-violet-500/10 px-1.5 py-0.5 text-[9px] not-italic text-violet-300">{tag}</i>
              )) : '—'}
            </span>
            <small className={cn('max-[550px]:hidden', ui.muted(isDark))}>{new Date(item.createdAt).toLocaleDateString()}</small>
          </div>
        ))}
      </div>
    );
  }

  if (view === 'Bookings') {
    return (
      <div className="grid gap-2.5">
        {items.map((item) => (
          <article className={cn(ui.card(isDark), 'grid grid-cols-[48px_1fr_auto_auto] items-center gap-3 p-[14px_17px] max-[550px]:grid-cols-[45px_1fr_auto]')} key={item._id}>
            <div className="grid h-[46px] w-[46px] place-content-center place-items-center rounded-xl bg-violet-500/15 text-violet-300">
              <b className="font-display text-[17px] font-semibold">{new Date(item.startsAt).toLocaleDateString(undefined, { day: '2-digit' })}</b>
              <small className="text-[9px] uppercase">{new Date(item.startsAt).toLocaleDateString(undefined, { month: 'short' })}</small>
            </div>
            <div>
              <h3 className={cn('mb-1 font-display text-sm font-semibold', ui.h3)}>{item.title}</h3>
              <p className={cn('m-0 text-[11px]', ui.muted(isDark))}>{item.clientName} · {item.clientEmail}</p>
              {item.source === 'store' && (
                <span className="mt-1 inline-block text-[10px] text-amber-400">Store booking</span>
              )}
              {item.notes && (
                <p className={cn('mt-1 text-[10px] leading-snug', ui.muted(isDark))}>{item.notes}</p>
              )}
              {item.joinLink && item.status === 'confirmed' && (
                <a href={item.joinLink} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[10px] text-violet-400 no-underline">
                  Join link added
                </a>
              )}
            </div>
            <div className="text-right">
              <b className="block text-[11px]">{new Date(item.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b>
              <small className={cn('mt-0.5 block text-[10px]', ui.muted(isDark))}>{item.duration} min</small>
              {item.status === 'pending' ? (
                <button type="button" className="mt-1 text-[10px] font-semibold text-emerald-400" onClick={() => onConfirm(item)}>
                  Confirm & send link
                </button>
              ) : item.status === 'confirmed' && (
                <button type="button" className="mt-1 text-[10px] text-violet-400" onClick={() => onUpdateJoinLink(item._id, item.joinLink)}>
                  {item.joinLink ? 'Edit link' : 'Add link'}
                </button>
              )}
            </div>
            <span className="max-[550px]:hidden"><StatusPill status={item.status}/></span>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 max-[800px]:grid-cols-2 max-[550px]:grid-cols-1">
      {items.map((item) => (
        <article className={cn(ui.card(isDark), 'p-[18px]')} key={item._id}>
          <div className="flex items-center justify-between">
            <StatusPill status={item.status}/>
            <small className={cn('text-[10px] capitalize', ui.muted(isDark))}>To: {item.audience}</small>
          </div>
          <h3 className={cn('mt-5 font-display text-sm font-semibold', ui.h3)}>{item.name}</h3>
          <p className={cn('mt-1 h-[33px] text-[11px] leading-relaxed', ui.muted(isDark))}>{item.subject}</p>
          <div className={cn('mt-5 flex items-center justify-between border-t pt-3 text-[10px]', isDark ? 'border-violet-300/10 text-[#aaa4b9]' : 'border-violet-200/15 text-[#817b94]')}>
            <span>{item.status === 'sent' ? `${item.recipientCount} recipients` : 'Not sent yet'}</span>
            {item.status !== 'sent' && (
              <button type="button" className={cn(ui.primary, 'px-2.5 py-1.5 text-[10px]')} onClick={() => onSend(item)}>
                <Send size={14}/>Send now
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function Analytics({ data, isDark }) {
  const stats = [
    ['Revenue', `$${data.revenue.toFixed(2)}`],
    ['Sales', data.sales],
    ['Audience', data.contacts],
    ['Subscribers', data.subscribers],
    ['Upcoming bookings', data.upcomingBookings],
    ['Email open rate', `${data.emailOpenRate}%`]
  ];

  return (
    <>
      <div className="grid grid-cols-3 gap-4 max-[800px]:grid-cols-2 max-[550px]:gap-2.5">
        {stats.map(([label, value]) => (
          <article className={ui.metric(isDark)} key={label}>
            <p className={cn('text-xs', ui.muted(isDark))}>{label}</p>
            <h2 className={ui.h2}>{value}</h2>
            <span className={cn('text-[10px]', ui.muted(isDark))}>All time</span>
          </article>
        ))}
      </div>
      <article className={cn(ui.card(isDark), 'mt-4 h-[290px] p-[21px]')}>
        <div className={ui.cardTitle}>
          <div>
            <h3 className={ui.h3}>Revenue momentum</h3>
            <p className={cn('text-xs', ui.muted(isDark))}>Growth signal from your current product sales</p>
          </div>
        </div>
        <div className={cn(
          'mt-7 flex h-[190px] items-end gap-3 border-b px-2',
          isDark ? 'border-violet-300/10' : 'border-violet-200/15'
        )}>
          {data.chart.map((height, index) => (
            <div
              key={index}
              className={cn(
                'min-h-[8px] flex-1 rounded-t-md opacity-85',
                index % 3 === 2
                  ? 'bg-gradient-to-t from-[#8a55d8] to-[#e6a0ff]'
                  : 'bg-gradient-to-t from-[#653cce] to-[#a681ff]'
              )}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </article>
    </>
  );
}

function CreateModal({ view, form, setForm, submit, close, isDark }) {
  const input = (key, label, type = 'text', placeholder = '') => (
    <FormField label={label} isDark={isDark}>
      <input required type={type} className={ui.input(isDark)} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder}/>
    </FormField>
  );

  return (
    <ModalShell isDark={isDark} onClose={close}>
      <button type="button" className={ui.closeBtn(isDark)} onClick={close}><X size={19}/></button>
      <form onSubmit={submit}>
        <p className={ui.eyebrow}>CREATE {view.slice(0, -1).toUpperCase()}</p>
        <h2 className={ui.h2}>
          {view === 'Customers' ? 'Add a contact' : view === 'Bookings' ? 'Schedule a booking' : 'Build your campaign'}
        </h2>
        {view === 'Customers' && (
          <>
            {input('name', 'Full name', 'text', 'Alex Morgan')}
            {input('email', 'Email address', 'email', 'alex@example.com')}
            <FormField label="Stage" isDark={isDark}>
              <select className={ui.input(isDark)} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="lead">Lead</option>
                <option value="subscriber">Subscriber</option>
                <option value="customer">Customer</option>
              </select>
            </FormField>
            {input('tags', 'Tags (comma-separated)', 'text', 'coach, launch')}
          </>
        )}
        {view === 'Bookings' && (
          <>
            {input('title', 'Booking title', 'text', 'Strategy session')}
            {input('clientName', 'Client name', 'text', 'Alex Morgan')}
            {input('clientEmail', 'Client email', 'email', 'alex@example.com')}
            <div className={ui.formRow}>
              {input('startsAt', 'Date and time', 'datetime-local')}
              {input('duration', 'Minutes', 'number')}
            </div>
            <FormField label="Live session link (Google Meet, Zoom, etc.)" isDark={isDark}>
              <input type="url" className={ui.input(isDark)} value={form.joinLink} onChange={(e) => setForm({ ...form, joinLink: e.target.value })} placeholder="https://meet.google.com/abc-defg-hij"/>
            </FormField>
          </>
        )}
        {view === 'Campaigns' && (
          <>
            {input('name', 'Campaign name', 'text', 'December newsletter')}
            {input('subject', 'Email subject', 'text', 'A little update from me')}
            <FormField label="Audience" isDark={isDark}>
              <select className={ui.input(isDark)} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                <option value="all">Everyone</option>
                <option value="leads">Leads</option>
                <option value="subscribers">Subscribers</option>
                <option value="customers">Customers</option>
              </select>
            </FormField>
            <FormField label="Email content" isDark={isDark}>
              <textarea className={ui.textarea(isDark)} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write your email..."/>
            </FormField>
          </>
        )}
        <button type="submit" className={cn(ui.primary, ui.wide)}>Create {view.slice(0, -1)}</button>
      </form>
    </ModalShell>
  );
}
