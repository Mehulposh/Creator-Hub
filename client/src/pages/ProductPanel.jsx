import { useEffect, useState } from 'react';
import { ExternalLink, PackagePlus, Plus, Trash2, Upload, X } from 'lucide-react';
import { productApi, uploadApi } from '../lib/api';
import { useTheme, ui } from '../lib/ui';
import { SectionHead, LoadingBlock, EmptyBlock, ModalShell, FormField, StatusPill } from '../components/ui';
import { cn } from '../lib/cn';

const emptyProduct = { title: '', description: '', price: '', type: 'digital_download', status: 'draft', coverColor: '#8b5cf6', downloadUrl: '', downloadLimit: 5, fileUrl: '', fileFilename: '', licenseType: 'personal' };

export function ProductPanel() {
  const isDark = useTheme();
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try { setLoading(true); setProducts(await productApi.list()); } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openEdit = (product) => {
    setEditing(product._id);
    setForm({ title: product.title, description: product.description || '', price: product.price, type: product.type, status: product.status, coverColor: product.coverColor, downloadUrl: product.downloadUrl || '', downloadLimit: product.downloadLimit || 5, fileUrl: product.fileUrl || '', fileFilename: product.fileFilename || '', licenseType: product.licenseType || 'personal' });
    setOpen(true);
  };

  const closeModal = () => { setOpen(false); setEditing(null); setForm(emptyProduct); };

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form, price: Number(form.price), downloadLimit: Number(form.downloadLimit) };
      if (editing) {
        const updated = await productApi.update(editing, payload);
        setProducts(products.map((item) => item._id === updated._id ? updated : item));
      } else {
        const product = await productApi.create(payload);
        setProducts([product, ...products]);
      }
      closeModal();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const publish = async (product) => {
    try {
      const updated = await productApi.update(product._id, { status: product.status === 'published' ? 'draft' : 'published' });
      setProducts(products.map((item) => item._id === updated._id ? updated : item));
    } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    await productApi.remove(id);
    setProducts(products.filter((p) => p._id !== id));
  };

  return (
    <section className={ui.page}>
      <SectionHead
        isDark={isDark}
        eyebrow="DIGITAL COMMERCE"
        title="Your products"
        description="Create offers and turn your expertise into income."
        action={
          <button type="button" className={ui.primary} onClick={() => { setEditing(null); setForm(emptyProduct); setOpen(true); }}>
            <Plus size={18} />New product
          </button>
        }
      />

      {error && <p className={ui.formError}>{error}</p>}

      {loading ? (
        <LoadingBlock text="Loading your products..." isDark={isDark} />
      ) : products.length === 0 ? (
        <EmptyBlock
          isDark={isDark}
          icon={<PackagePlus size={26} />}
          title="Create your first product"
          description="Start with a digital download, template, course, membership, or coaching offer."
          action={
            <button type="button" className={ui.primary} onClick={() => setOpen(true)}>
              <Plus size={17} />Create product
            </button>
          }
        />
      ) : (
        <div className={ui.productGrid}>
          {products.map((product) => (
            <article className={cn(ui.card(isDark), 'relative overflow-hidden')} key={product._id}>
              <div
                className="relative flex h-[150px] items-center justify-center font-display text-[44px] font-bold text-white"
                style={{ background: `linear-gradient(145deg, ${product.coverColor}, #211638)` }}
              >
                <span>{product.type === 'course' ? '▶' : product.type === 'template' ? 'N' : '✦'}</span>
                <button
                  type="button"
                  className="absolute right-2.5 top-2.5 grid place-items-center rounded-lg border border-white/20 bg-[#160d2d44] p-1.5 text-white"
                  onClick={() => openEdit(product)}
                  title="Edit"
                >
                  ✎
                </button>
              </div>
              <div className="p-4">
                <div className={cn('flex items-center justify-between text-[10px] capitalize', ui.muted(isDark))}>
                  <StatusPill status={product.status} />
                  <small>{product.type.replace('_', ' ')}</small>
                </div>
                <h3 className={cn('my-3 font-display text-[15px] font-semibold')}>{product.title}</h3>
                <p className={cn('m-0 line-clamp-2 h-[34px] text-[11px] leading-snug', ui.muted(isDark))}>
                  {product.description || 'No description added yet.'}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <b className="font-display text-[17px] font-semibold">${Number(product.price).toFixed(2)}</b>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-1 border-0 bg-transparent text-[11px] text-violet-400"
                      onClick={() => publish(product)}
                    >
                      {product.status === 'published' ? 'Unpublish' : 'Publish'} <ExternalLink size={13} />
                    </button>
                    <button type="button" className="border-0 bg-transparent text-violet-400" onClick={() => remove(product._id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {open && (
        <ModalShell isDark={isDark} onClose={closeModal}>
          <form onSubmit={submit}>
            <button type="button" className={ui.closeBtn(isDark)} onClick={closeModal}>
              <X size={19} />
            </button>
            <p className={ui.eyebrow}>{editing ? 'EDIT OFFER' : 'NEW OFFER'}</p>
            <h2 className={ui.h2}>{editing ? 'Edit product' : 'Create a product'}</h2>

            <FormField label="Product name" isDark={isDark}>
              <input required className={ui.input(isDark)} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </FormField>

            <FormField label="Description" isDark={isDark}>
              <textarea className={ui.textarea(isDark)} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </FormField>

            <div className={ui.formRow}>
              <FormField label="Type" isDark={isDark}>
                <select className={ui.input(isDark)} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="digital_download">Digital download</option>
                  <option value="template">Template</option>
                  <option value="course">Course</option>
                  <option value="membership">Membership</option>
                  <option value="coaching">Coaching</option>
                </select>
              </FormField>
              <FormField label="Price (USD)" isDark={isDark}>
                <input required type="number" min="0" step="0.01" className={ui.input(isDark)} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </FormField>
            </div>

            <FormField label="Upload product file (PDF, ZIP, etc.)" isDark={isDark}>
              <input type="file" className={ui.input(isDark)} onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setUploading(true);
                  const result = await uploadApi.productFile(file);
                  setForm({ ...form, fileUrl: result.url, fileFilename: result.filename, downloadUrl: result.url });
                } catch (err) { setError(err.message); } finally { setUploading(false); }
              }}/>
              {form.fileFilename && <small className={cn('mt-1 block text-[10px] text-emerald-400', ui.muted(isDark))}><Upload size={12} className="inline"/> {form.fileFilename}</small>}
              {uploading && <small className="text-[10px] text-violet-400">Uploading...</small>}
            </FormField>

            <FormField label="Download URL (external link, optional)" isDark={isDark}>
              <input type="url" className={ui.input(isDark)} value={form.downloadUrl} onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })} placeholder="https://..." />
            </FormField>

            <FormField label="License type" isDark={isDark}>
              <select className={ui.input(isDark)} value={form.licenseType} onChange={(e) => setForm({ ...form, licenseType: e.target.value })}>
                <option value="personal">Personal use</option>
                <option value="commercial">Commercial use</option>
                <option value="extended">Extended license</option>
                <option value="none">No license specified</option>
              </select>
            </FormField>

            <FormField label="Download limit" isDark={isDark}>
              <input type="number" min="1" max="100" className={ui.input(isDark)} value={form.downloadLimit} onChange={(e) => setForm({ ...form, downloadLimit: e.target.value })} />
            </FormField>

            <FormField label="Cover color" isDark={isDark}>
              <input className={cn(ui.input(isDark), 'h-[38px] p-1')} type="color" value={form.coverColor} onChange={(e) => setForm({ ...form, coverColor: e.target.value })} />
            </FormField>

            <button type="submit" className={cn(ui.primary, ui.wide)} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Create product'}
            </button>
          </form>
        </ModalShell>
      )}
    </section>
  );
}
