import { useEffect, useState } from 'react';
import { Bell, BookOpen, Check, Crown, LoaderCircle, MessageSquare, Pencil, Plus, Send, Trash2, X } from 'lucide-react';
import { communityApi, learningApi } from '../lib/api';
import { useTheme, ui } from '../lib/ui';
import { SectionHead, LoadingBlock, EmptyBlock, ModalShell, FormField, StatusPill } from '../components/ui';
import { cn } from '../lib/cn';

const emptyForm = { title: '', name: '', description: '', price: '', interval: 'monthly', perks: '', content: '', category: 'discussion' };

const copy = {
  Courses: ['Courses', 'Create a transformational learning experience for your audience.', 'New course'],
  Memberships: ['Memberships', 'Build recurring revenue through valuable exclusive access.', 'New membership'],
  Community: ['Community', 'Bring your people together around shared growth.', 'Write a post'],
  Notifications: ['Notifications', 'Stay in touch with what is happening across your business.', null]
};

const actionBtn = 'cursor-pointer rounded-lg border-0 bg-violet-500/13 px-2.5 py-1.5 text-[10px] text-[#b79fff]';

export function LearningPanel({ view }) {
  const isDark = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [lessonOpen, setLessonOpen] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', duration: 10, isPreview: false });
  const [notifications, setNotifications] = useState([]);

  const load = async () => {
    try {
      setLoading(true); setError('');
      if (view === 'Courses') setItems(await learningApi.courses());
      else if (view === 'Memberships') setItems(await learningApi.memberships());
      else if (view === 'Community') setItems(await communityApi.posts());
      else setNotifications(await communityApi.notifications());
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); setEditingId(null); setOpen(false); }, [view]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setOpen(true); };

  const openEdit = (course) => {
    setEditingId(course._id);
    setForm({ ...emptyForm, title: course.title, description: course.description || '', price: String(course.price ?? 0) });
    setOpen(true);
  };

  const closeModal = () => { setOpen(false); setEditingId(null); setForm(emptyForm); };

  const submit = async (event) => {
    event.preventDefault();
    try {
      let item;
      if (view === 'Courses') {
        const payload = { title: form.title, description: form.description, price: Number(form.price || 0) };
        item = editingId ? await learningApi.updateCourse(editingId, payload) : await learningApi.createCourse(payload);
        setItems(editingId ? items.map((c) => c._id === item._id ? item : c) : [item, ...items]);
      } else if (view === 'Memberships') {
        item = await learningApi.createMembership({ name: form.name, description: form.description, price: Number(form.price), interval: form.interval, perks: form.perks.split(',').map((x) => x.trim()).filter(Boolean) });
        setItems([item, ...items]);
      } else if (view === 'Community') {
        item = await communityApi.createPost({ content: form.content, category: form.category });
        setItems([item, ...items]);
      }
      closeModal();
    } catch (e) { setError(e.message); }
  };

  const deleteCourse = async (id) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    try {
      await learningApi.deleteCourse(id);
      setItems(items.filter((c) => c._id !== id));
    } catch (e) { setError(e.message); }
  };

  const togglePublish = async (course) => {
    try {
      const status = course.status === 'published' ? 'draft' : 'published';
      const updated = await learningApi.updateCourse(course._id, { status });
      setItems(items.map((c) => c._id === updated._id ? updated : c));
    } catch (e) { setError(e.message); }
  };

  const addLesson = async (e) => {
    e.preventDefault();
    const course = items.find((c) => c._id === lessonOpen);
    const lessons = [...(course.lessons || []), { title: lessonForm.title, content: lessonForm.content, duration: Number(lessonForm.duration), isPreview: lessonForm.isPreview }];
    const updated = await learningApi.updateCourse(lessonOpen, { lessons });
    setItems(items.map((c) => c._id === updated._id ? updated : c));
    setLessonOpen(null);
    setLessonForm({ title: '', content: '', duration: 10, isPreview: false });
  };

  const markRead = async (item) => {
    const updated = await communityApi.read(item._id);
    setNotifications(notifications.map((n) => n._id === updated._id ? updated : n));
  };

  const [title, description, action] = copy[view];
  return (
    <section className={ui.page}>
      <SectionHead
        isDark={isDark}
        eyebrow="CREATE • CONNECT • GROW"
        title={title}
        description={description}
        action={action && (
          <button className={ui.primary} onClick={openCreate}><Plus size={18}/>{action}</button>
        )}
      />
      {error && <p className={ui.formError}>{error}</p>}
      {loading ? <LoadingBlock isDark={isDark} text="Loading workspace..." /> : view === 'Notifications' ? (
        <NotificationList items={notifications} markRead={markRead} isDark={isDark}/>
      ) : view === 'Community' ? (
        <CommunityFeed items={items} isDark={isDark}/>
      ) : (
        <OfferGrid
          view={view}
          items={items}
          open={openCreate}
          isDark={isDark}
          onAddLesson={view === 'Courses' ? setLessonOpen : null}
          onEdit={view === 'Courses' ? openEdit : null}
          onDelete={view === 'Courses' ? deleteCourse : null}
          onTogglePublish={view === 'Courses' ? togglePublish : null}
        />
      )}
      {open && <Modal view={view} form={form} setForm={setForm} close={closeModal} submit={submit} editing={!!editingId} isDark={isDark}/>}
      {lessonOpen && (
        <ModalShell isDark={isDark} onClose={() => setLessonOpen(null)}>
          <button type="button" className={ui.closeBtn(isDark)} onClick={() => setLessonOpen(null)}><X size={19}/></button>
          <form onSubmit={addLesson}>
            <h2 className={ui.h2}>Add lesson</h2>
            <FormField label="Lesson title" isDark={isDark}>
              <input required className={ui.input(isDark)} value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="e.g. Introduction to the course"/>
            </FormField>
            <FormField label="Lesson content" isDark={isDark}>
              <textarea required className={ui.textarea(isDark)} value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} placeholder="Write the lesson material, notes, or instructions for students..." rows={6}/>
            </FormField>
            <FormField label="Duration (minutes)" isDark={isDark}>
              <input type="number" min="1" className={ui.input(isDark)} value={lessonForm.duration} onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}/>
            </FormField>
            <label className={cn('mt-3.5 flex items-center gap-2 text-sm', ui.muted(isDark))}>
              <input type="checkbox" checked={lessonForm.isPreview} onChange={(e) => setLessonForm({ ...lessonForm, isPreview: e.target.checked })}/>
              Free preview lesson
            </label>
            <button className={cn(ui.primary, ui.wide)}>Add lesson</button>
          </form>
        </ModalShell>
      )}
    </section>
  );
}

function OfferGrid({ view, items, open, isDark, onAddLesson, onEdit, onDelete, onTogglePublish }) {
  if (!items.length) {
    return (
      <EmptyBlock
        isDark={isDark}
        icon={view === 'Courses' ? <BookOpen size={25}/> : <Crown size={25}/>}
        title={`Create your first ${view.slice(0, -1).toLowerCase()}`}
        action={<button className={ui.primary} onClick={open}>Get started</button>}
      />
    );
  }
  return (
    <div className="grid grid-cols-3 gap-4 max-[800px]:grid-cols-2 max-[500px]:grid-cols-1">
      {items.map((item) => (
        <article className={cn('relative p-5', ui.card(isDark))} key={item._id}>
          <div className="mb-[18px] grid h-11 w-11 place-items-center rounded-[13px] bg-violet-500/12 text-[#b498ff]">
            {view === 'Courses' ? <BookOpen/> : <Crown/>}
          </div>
          <span className="absolute right-[18px] top-[18px]"><StatusPill status={item.status}/></span>
          <h3 className={cn(ui.h3, 'mb-1.5')}>{item.title || item.name}</h3>
          <p className={cn('min-h-[38px] text-[11px] leading-relaxed', ui.muted(isDark))}>{item.description || 'No description added yet.'}</p>
          {view === 'Courses' && item.lessons?.length > 0 && (
            <ul className={cn('my-2 list-none p-0 text-[11px]', ui.muted(isDark))}>
              {item.lessons.map((l, i) => (
                <li key={i} className={cn('border-b py-1', isDark ? 'border-violet-300/10' : 'border-violet-200/15')}>
                  <b className={isDark ? 'text-[#f4f1fb]' : 'text-[#28243b]'}>{l.title}</b> · {l.duration}min{l.isPreview ? ' (preview)' : ''}
                  {l.content && <p className={cn('mt-1 text-[10px] leading-snug', ui.muted(isDark))}>{l.content.slice(0, 120)}{l.content.length > 120 ? '…' : ''}</p>}
                </li>
              ))}
            </ul>
          )}
          <div className={cn('mt-[18px] flex items-center justify-between border-t pt-3.5', isDark ? 'border-violet-300/10' : 'border-violet-200/15')}>
            <b className="font-display text-[17px] font-semibold">
              ${item.price}{view === 'Memberships' && <small className={cn('text-[10px] font-normal', ui.muted(isDark))}> / {item.interval}</small>}
            </b>
            <span className={cn('text-[10px]', ui.muted(isDark))}>{view === 'Courses' ? `${item.lessons?.length || 0} lessons` : `${item.members} members`}</span>
          </div>
          {view === 'Courses' && (
            <div className={cn('mt-3 flex flex-wrap gap-1.5 border-t pt-3', isDark ? 'border-violet-300/10' : 'border-violet-200/15')}>
              {onAddLesson && <button type="button" className={actionBtn} onClick={() => onAddLesson(item._id)}>+ Lesson</button>}
              {onTogglePublish && (
                <button type="button" className={actionBtn} onClick={() => onTogglePublish(item)}>
                  {item.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
              )}
              {onEdit && <button type="button" className={cn(actionBtn, 'grid place-items-center px-2 py-1.5')} onClick={() => onEdit(item)} title="Edit course"><Pencil size={14}/></button>}
              {onDelete && <button type="button" className={cn(actionBtn, 'grid place-items-center bg-rose-400/10 px-2 py-1.5 text-rose-300')} onClick={() => onDelete(item._id)} title="Delete course"><Trash2 size={14}/></button>}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function CommunityFeed({ items, isDark }) {
  return (
    <div className="grid max-w-[760px] gap-[13px]">
      {!items.length && (
        <EmptyBlock isDark={isDark} icon={<MessageSquare size={25}/>} title="Start the conversation"/>
      )}
      {items.map((item) => (
        <article className={cn('flex gap-[11px] p-[18px] max-[500px]:p-3.5', ui.card(isDark))} key={item._id}>
          <div className="grid h-[33px] w-[33px] shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-[#ad90ff] to-[#6e4dd7] text-xs font-bold">
            {item.authorName.slice(0, 1)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <b className="text-xs">{item.authorName}</b>
              <StatusPill status={item.category}/>
            </div>
            <p className="my-2.5 text-xs leading-relaxed">{item.content}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function NotificationList({ items, markRead, isDark }) {
  return (
    <div className="grid max-w-[700px] gap-2.5">
      {!items.length && (
        <EmptyBlock isDark={isDark} icon={<Bell size={25}/>} title="You're all caught up"/>
      )}
      {items.map((item) => (
        <article className={cn('flex items-center gap-3 p-[15px]', ui.card(isDark), item.read && 'opacity-55')} key={item._id}>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-violet-500/11 text-[#b498ff]">
            <Bell size={17}/>
          </div>
          <div className="flex-1">
            <b className="text-xs">{item.title}</b>
            <p className={cn('my-0.5 text-[11px]', ui.muted(isDark))}>{item.message}</p>
          </div>
          {!item.read && (
            <button className="grid h-[30px] w-[30px] place-items-center rounded-lg border-0 bg-violet-500/11 text-[#b498ff]" onClick={() => markRead(item)}>
              <Check size={16}/>
            </button>
          )}
        </article>
      ))}
    </div>
  );
}

function Modal({ view, form, setForm, close, submit, editing, isDark }) {
  const field = (key, label, type = 'text') => (
    <FormField label={label} isDark={isDark}>
      <input required type={type} className={ui.input(isDark)} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}/>
    </FormField>
  );
  return (
    <ModalShell isDark={isDark} onClose={close}>
      <button type="button" className={ui.closeBtn(isDark)} onClick={close}><X size={19}/></button>
      <form onSubmit={submit}>
        <p className={ui.eyebrow}>{editing ? 'EDIT COURSE' : `NEW ${view.slice(0, -1).toUpperCase()}`}</p>
        <h2 className={ui.h2}>{editing ? 'Update course' : view === 'Courses' ? 'Build a course' : view === 'Memberships' ? 'Set up a membership' : 'Share with your community'}</h2>
        {view === 'Courses' && (
          <>
            {field('title', 'Course title')}
            <FormField label="Description" isDark={isDark}>
              <textarea className={ui.textarea(isDark)} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/>
            </FormField>
            {field('price', 'Price (USD)', 'number')}
          </>
        )}
        {view === 'Memberships' && (
          <>
            {field('name', 'Membership name')}
            <FormField label="Description" isDark={isDark}>
              <textarea className={ui.textarea(isDark)} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/>
            </FormField>
            <div className={ui.formRow}>
              {field('price', 'Price (USD)', 'number')}
              <FormField label="Billing" isDark={isDark}>
                <select className={ui.input(isDark)} value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })}>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </FormField>
            </div>
            {field('perks', 'Perks (comma-separated)')}
          </>
        )}
        {view === 'Community' && (
          <>
            <FormField label="Post type" isDark={isDark}>
              <select className={ui.input(isDark)} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="discussion">Discussion</option>
                <option value="announcement">Announcement</option>
                <option value="win">Win</option>
              </select>
            </FormField>
            <FormField label="Your post" isDark={isDark}>
              <textarea required className={ui.textarea(isDark)} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}/>
            </FormField>
          </>
        )}
        <button className={cn(ui.primary, ui.wide)}><Send size={16}/>{editing ? 'Save changes' : 'Publish'}</button>
      </form>
    </ModalShell>
  );
}
