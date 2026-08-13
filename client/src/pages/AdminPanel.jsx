import { useEffect, useState } from 'react';
import { BarChart3, BookOpen, CircleDollarSign, Mail, MessageSquare, Package, ShieldCheck, Trash2, Users } from 'lucide-react';
import { adminApi } from '../lib/api';
import { useTheme, ui } from '../lib/ui';
import { SectionHead, LoadingBlock, StatusPill } from '../components/ui';
import { cn } from '../lib/cn';

const tabs = [
  ['Overview', BarChart3],
  ['Users', Users],
  ['Products', Package],
  ['Courses', BookOpen],
  ['Orders', CircleDollarSign],
  ['Campaigns', Mail],
  ['Community', MessageSquare]
];

const adminAvatar = 'grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-violet-500/15 text-[11px] font-bold text-violet-300';
const actionBtn = 'cursor-pointer rounded-lg border-0 bg-violet-500/10 px-2.5 py-1.5 text-[11px] text-violet-300';
const selectField = cn(actionBtn, 'outline-none');

function AdminRow({ children, cols = 'grid-cols-[35px_1fr_auto_auto]' }) {
  const isDark = useTheme();
  return (
    <div className={cn(
      'grid items-center gap-2.5 border-b py-3 last:border-0 max-[500px]:grid-cols-[31px_1fr_auto]',
      cols,
      isDark ? 'border-violet-300/10' : 'border-violet-200/15'
    )}>
      {children}
    </div>
  );
}

function ManageTable({ columns, cols, children }) {
  const isDark = useTheme();
  return (
    <div className={ui.tableCard(isDark)}>
      <div className={cn(
        'grid gap-3 border-b px-4 py-3 text-[10px] font-bold uppercase tracking-wide',
        cols,
        isDark ? 'border-violet-300/10 text-[#aaa4b9]' : 'border-violet-200/15 text-[#817b94]'
      )}>
        {columns.map((col) => <span key={col}>{col}</span>)}
      </div>
      {children}
    </div>
  );
}

function ManageRow({ cols, children }) {
  const isDark = useTheme();
  return (
    <div className={cn(
      'grid items-center gap-3 border-b px-4 py-3 text-sm last:border-0',
      cols,
      isDark ? 'border-violet-300/10' : 'border-violet-200/15'
    )}>
      {children}
    </div>
  );
}

export function AdminPanel({ view = 'Overview' }) {
  const isDark = useTheme();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [courses, setCourses] = useState([]);
  const [posts, setPosts] = useState([]);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true); setError('');
      if (view === 'Overview') setOverview(await adminApi.overview());
      else if (view === 'Users') setUsers(await adminApi.users());
      else if (view === 'Products') setProducts(await adminApi.products());
      else if (view === 'Courses') setCourses(await adminApi.courses());
      else if (view === 'Orders') setOrders(await adminApi.orders());
      else if (view === 'Campaigns') setCampaigns(await adminApi.campaigns());
      else if (view === 'Community') setPosts(await adminApi.posts());
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [view]);

  const updateRole = async (id, role) => {
    await adminApi.updateUser(id, { role });
    setUsers(users.map((u) => u._id === id ? { ...u, role } : u));
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    await adminApi.deleteUser(id);
    setUsers(users.filter((u) => u._id !== id));
  };

  const toggleProduct = async (id, status) => {
    const next = status === 'published' ? 'draft' : 'published';
    await adminApi.updateProduct(id, { status: next });
    setProducts(products.map((p) => p._id === id ? { ...p, status: next } : p));
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    await adminApi.deleteProduct(id);
    setProducts(products.filter((p) => p._id !== id));
  };

  const deleteCampaign = async (id) => {
    if (!confirm('Delete this campaign?')) return;
    await adminApi.deleteCampaign(id);
    setCampaigns(campaigns.filter((c) => c._id !== id));
  };

  const deletePost = async (id) => {
    if (!confirm('Remove this post?')) return;
    await adminApi.deletePost(id);
    setPosts(posts.filter((p) => p._id !== id));
  };

  const toggleCourse = async (id, status) => {
    const next = status === 'published' ? 'draft' : 'published';
    await adminApi.updateCourse(id, { status: next });
    setCourses(courses.map((c) => c._id === id ? { ...c, status: next } : c));
  };

  const deleteCourse = async (id) => {
    if (!confirm('Delete this course?')) return;
    await adminApi.deleteCourse(id);
    setCourses(courses.filter((c) => c._id !== id));
  };

  if (error) return <section className={ui.page}><p className={ui.formError}>{error}</p></section>;
  if (loading) return <section className={ui.page}><LoadingBlock text="Loading..." isDark={isDark}/></section>;

  if (view === 'Overview' && overview) {
    const cards = [
      ['Total users', overview.metrics.users, Users],
      ['Creators', overview.metrics.creators, ShieldCheck],
      ['Products', overview.metrics.products, Package],
      ['Courses', overview.metrics.courses ?? 0, BookOpen],
      ['Revenue', `$${overview.metrics.revenue.toFixed(2)}`, CircleDollarSign]
    ];
    return (
      <section className={ui.page}>
        <SectionHead
          eyebrow="PLATFORM ADMINISTRATION"
          title="Control center"
          description="Monitor platform health, users, commerce, and community."
          isDark={isDark}
          action={
            <span className="flex items-center gap-1.5 rounded-[9px] border border-violet-400/25 bg-violet-500/10 px-2.5 py-1.5 text-[10px] font-bold text-violet-300">
              <ShieldCheck size={15}/>Admin only
            </span>
          }
        />
        <div className={ui.metrics}>
          {cards.map(([label, value, Icon]) => (
            <article className={ui.metric(isDark)} key={label}>
              <div className={cn(ui.metricIconBase, ui.metricIcon.violet)}><Icon size={19}/></div>
              <p className={cn('text-xs', ui.muted(isDark))}>{label}</p>
              <h2 className={ui.h2}>{value}</h2>
            </article>
          ))}
        </div>
        <div className={ui.grid2}>
          <article className={cn(ui.card(isDark), 'p-[19px]')}>
            <div className={ui.cardTitle}><h3 className={ui.h3}>Recent creators</h3></div>
            {overview.recentUsers.map((item) => (
              <AdminRow key={item._id}>
                <div className={adminAvatar}>{item.name.slice(0, 1)}</div>
                <div>
                  <b className="block text-[11px]">{item.name}</b>
                  <small className={cn('mt-0.5 block text-[9px]', ui.muted(isDark))}>{item.email}</small>
                </div>
                <StatusPill status={item.role}/>
              </AdminRow>
            ))}
          </article>
          <article className={cn(ui.card(isDark), 'p-[19px]')}>
            <div className={ui.cardTitle}><h3 className={ui.h3}>Recent orders</h3></div>
            {overview.recentOrders.length ? overview.recentOrders.map((item) => (
              <AdminRow key={item._id}>
                <div className={adminAvatar}>$</div>
                <div>
                  <b className="block text-[11px]">{item.product?.title || 'Product'}</b>
                  <small className={cn('mt-0.5 block text-[9px]', ui.muted(isDark))}>{item.buyerEmail}</small>
                </div>
                <b className="text-[11px]">${item.amount.toFixed(2)}</b>
                <StatusPill status={item.status}/>
              </AdminRow>
            )) : (
              <p className={cn('py-9 text-center text-[11px]', ui.muted(isDark))}>No orders yet.</p>
            )}
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className={ui.page}>
      <SectionHead
        eyebrow="PLATFORM ADMINISTRATION"
        title={`Manage ${view.toLowerCase()}`}
        isDark={isDark}
      />

      {view === 'Users' && (
        <ManageTable columns={['User', 'Role', 'Joined', 'Actions']} cols="grid-cols-4">
          {users.map((u) => (
            <ManageRow key={u._id} cols="grid-cols-4">
              <div>
                <b className="block">{u.name}</b>
                <small className={cn('mt-0.5 block text-[10px]', ui.muted(isDark))}>{u.email}</small>
              </div>
              <select className={selectField} value={u.role} onChange={(e) => updateRole(u._id, e.target.value)}>
                <option value="creator">creator</option>
                <option value="admin">admin</option>
                <option value="customer">customer</option>
              </select>
              <small className={ui.muted(isDark)}>{new Date(u.createdAt).toLocaleDateString()}</small>
              <button type="button" className={actionBtn} onClick={() => deleteUser(u._id)}><Trash2 size={14}/></button>
            </ManageRow>
          ))}
        </ManageTable>
      )}

      {view === 'Products' && (
        <ManageTable columns={['Product', 'Creator', 'Status', 'Actions']} cols="grid-cols-4">
          {products.map((p) => (
            <ManageRow key={p._id} cols="grid-cols-4">
              <div>
                <b className="block">{p.title}</b>
                <small className={cn('mt-0.5 block text-[10px]', ui.muted(isDark))}>${p.price}</small>
              </div>
              <small className={ui.muted(isDark)}>{p.creator?.name || '—'}</small>
              <StatusPill status={p.status}/>
              <div className="flex gap-1.5">
                <button type="button" className={actionBtn} onClick={() => toggleProduct(p._id, p.status)}>
                  {p.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button type="button" className={actionBtn} onClick={() => deleteProduct(p._id)}><Trash2 size={14}/></button>
              </div>
            </ManageRow>
          ))}
        </ManageTable>
      )}

      {view === 'Courses' && (
        <div className="grid max-w-[900px] gap-3">
          {courses.map((c) => (
            <article className={cn(ui.card(isDark), 'p-[18px]')} key={c._id}>
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <b className="mb-1 block text-sm">{c.title}</b>
                  <small className={cn('text-[11px]', ui.muted(isDark))}>
                    {c.creator?.name || 'Unknown creator'} · ${c.price} · {c.lessons?.length || 0} lessons · {c.enrolled || 0} enrolled
                  </small>
                </div>
                <StatusPill status={c.status}/>
              </div>
              {c.description && <p className={cn('mb-3 text-xs leading-relaxed', ui.muted(isDark))}>{c.description}</p>}
              {expandedCourse === c._id && c.lessons?.length > 0 && (
                <ul className={cn('mb-3 list-none border-t p-0', isDark ? 'border-violet-300/10' : 'border-violet-200/15')}>
                  {c.lessons.map((lesson, i) => (
                    <li key={i} className={cn('border-b py-2.5 text-xs last:border-0', isDark ? 'border-violet-300/10' : 'border-violet-200/15')}>
                      <b>{lesson.title}</b> · {lesson.duration}min
                      {lesson.content && (
                        <p className={cn('mt-1.5 text-[11px] leading-relaxed', ui.muted(isDark))}>
                          {lesson.content.slice(0, 200)}{lesson.content.length > 200 ? '…' : ''}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-1.5">
                <button type="button" className={actionBtn} onClick={() => setExpandedCourse(expandedCourse === c._id ? null : c._id)}>
                  {expandedCourse === c._id ? 'Hide lessons' : 'View lessons'}
                </button>
                <button type="button" className={actionBtn} onClick={() => toggleCourse(c._id, c.status)}>
                  {c.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button type="button" className={actionBtn} onClick={() => deleteCourse(c._id)}><Trash2 size={14}/></button>
              </div>
            </article>
          ))}
          {!courses.length && (
            <p className={cn('py-9 text-center text-[11px]', ui.muted(isDark))}>No courses on the platform yet.</p>
          )}
        </div>
      )}

      {view === 'Orders' && (
        <ManageTable columns={['Order', 'Buyer', 'Creator', 'Amount', 'Status']} cols="grid-cols-5">
          {orders.map((o) => (
            <ManageRow key={o._id} cols="grid-cols-5">
              <small>{o.product?.title || o.course?.title || 'Item'}</small>
              <small className={ui.muted(isDark)}>{o.buyerEmail}</small>
              <small className={ui.muted(isDark)}>{o.creator?.name || '—'}</small>
              <b>${o.amount.toFixed(2)}</b>
              <StatusPill status={o.status}/>
            </ManageRow>
          ))}
        </ManageTable>
      )}

      {view === 'Campaigns' && (
        <ManageTable columns={['Campaign', 'Creator', 'Status', 'Actions']} cols="grid-cols-4">
          {campaigns.map((c) => (
            <ManageRow key={c._id} cols="grid-cols-4">
              <div>
                <b className="block">{c.name}</b>
                <small className={cn('mt-0.5 block text-[10px]', ui.muted(isDark))}>{c.subject}</small>
              </div>
              <small className={ui.muted(isDark)}>{c.creator?.name || '—'}</small>
              <StatusPill status={c.status}/>
              <button type="button" className={actionBtn} onClick={() => deleteCampaign(c._id)}><Trash2 size={14}/></button>
            </ManageRow>
          ))}
        </ManageTable>
      )}

      {view === 'Community' && (
        <ManageTable columns={['Post', 'Creator', 'Category', 'Actions']} cols="grid-cols-4">
          {posts.map((p) => (
            <ManageRow key={p._id} cols="grid-cols-4">
              <p className="m-0 max-w-[280px] truncate text-xs">{p.content.slice(0, 80)}...</p>
              <small className={ui.muted(isDark)}>{p.creator?.name || p.authorName}</small>
              <StatusPill status={p.category}/>
              <button type="button" className={actionBtn} onClick={() => deletePost(p._id)}><Trash2 size={14}/></button>
            </ManageRow>
          ))}
        </ManageTable>
      )}
    </section>
  );
}

export { tabs as adminTabs };
