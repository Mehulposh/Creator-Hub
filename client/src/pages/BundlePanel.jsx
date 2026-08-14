import { useEffect, useState } from 'react';
import { Package, Plus, Trash2, X } from 'lucide-react';
import { bundleApi, productApi, learningApi } from '../lib/api';
import { useTheme, ui } from '../lib/ui';
import { SectionHead, LoadingBlock, EmptyBlock, ModalShell, FormField, StatusPill } from '../components/ui';
import { cn } from '../lib/cn';

export function BundlePanel() {
  const isDark = useTheme();
  const [bundles, setBundles] = useState([]);
  const [products, setProducts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: '', productIds: [], courseIds: [], coverColor: '#8b5cf6', status: 'draft' });
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([bundleApi.list(), productApi.list(), learningApi.courses()])
      .then(([b, p, c]) => { setBundles(b); setProducts(p); setCourses(c); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const bundle = await bundleApi.create({ ...form, price: Number(form.price) });
      setBundles([bundle, ...bundles]);
      setOpen(false);
    } catch (err) { setError(err.message); }
  };

  const toggle = async (bundle) => {
    const updated = await bundleApi.update(bundle._id, { status: bundle.status === 'published' ? 'draft' : 'published' });
    setBundles(bundles.map((b) => b._id === updated._id ? updated : b));
  };

  const remove = async (id) => {
    await bundleApi.remove(id);
    setBundles(bundles.filter((b) => b._id !== id));
  };

  const toggleId = (key, id) => {
    const list = form[key].includes(id) ? form[key].filter((x) => x !== id) : [...form[key], id];
    setForm({ ...form, [key]: list });
  };

  return (
    <section className={ui.page}>
      <SectionHead
        eyebrow="PRODUCT BUNDLES"
        title="Product bundles"
        description="Combine products and courses into discounted bundles."
        isDark={isDark}
        action={<button type="button" className={ui.primary} onClick={() => setOpen(true)}><Plus size={18}/>New bundle</button>}
      />
      {error && <p className={ui.formError}>{error}</p>}
      {loading ? <LoadingBlock isDark={isDark} text="Loading bundles..."/> : !bundles.length ? (
        <EmptyBlock icon={<Package size={25}/>} title="No bundles yet" description="Create a bundle to sell multiple items together." isDark={isDark}/>
      ) : (
        <div className={ui.productGrid}>
          {bundles.map((bundle) => (
            <article className={cn(ui.card(isDark), 'p-5')} key={bundle._id}>
              <StatusPill status={bundle.status}/>
              <h3 className={cn('mt-3 font-display text-sm font-semibold', ui.h3)}>{bundle.title}</h3>
              <p className={cn('text-[11px]', ui.muted(isDark))}>{bundle.productIds?.length || 0} products · {bundle.courseIds?.length || 0} courses</p>
              <b className="mt-2 block text-lg">${bundle.price}</b>
              <div className="mt-3 flex gap-2">
                <button type="button" className={ui.secondary(isDark)} onClick={() => toggle(bundle)}>{bundle.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                <button type="button" className="border-0 bg-transparent text-rose-300" onClick={() => remove(bundle._id)}><Trash2 size={14}/></button>
              </div>
            </article>
          ))}
        </div>
      )}
      {open && (
        <ModalShell isDark={isDark} onClose={() => setOpen(false)}>
          <button type="button" className={ui.closeBtn(isDark)} onClick={() => setOpen(false)}><X size={19}/></button>
          <form onSubmit={submit}>
            <p className={ui.eyebrow}>NEW BUNDLE</p>
            <h2 className={ui.h2}>Create bundle</h2>
            <FormField label="Title" isDark={isDark}><input required className={ui.input(isDark)} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}/></FormField>
            <FormField label="Description" isDark={isDark}><textarea className={ui.textarea(isDark)} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/></FormField>
            <FormField label="Bundle price ($)" isDark={isDark}><input required type="number" min="0" step="0.01" className={ui.input(isDark)} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}/></FormField>
            <FormField label="Include products" isDark={isDark}>
              <div className="flex flex-wrap gap-2">{products.map((p) => (
                <button type="button" key={p._id} className={cn('rounded-full px-3 py-1 text-[10px]', form.productIds.includes(p._id) ? 'bg-violet-500 text-white' : ui.secondary(isDark))} onClick={() => toggleId('productIds', p._id)}>{p.title}</button>
              ))}</div>
            </FormField>
            <FormField label="Include courses" isDark={isDark}>
              <div className="flex flex-wrap gap-2">{courses.map((c) => (
                <button type="button" key={c._id} className={cn('rounded-full px-3 py-1 text-[10px]', form.courseIds.includes(c._id) ? 'bg-violet-500 text-white' : ui.secondary(isDark))} onClick={() => toggleId('courseIds', c._id)}>{c.title}</button>
              ))}</div>
            </FormField>
            <button type="submit" className={cn(ui.primary, ui.wide)}>Create bundle</button>
          </form>
        </ModalShell>
      )}
    </section>
  );
}
