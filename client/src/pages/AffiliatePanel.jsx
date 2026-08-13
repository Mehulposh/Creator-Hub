import { useEffect, useState } from 'react';
import { Plus, Trash2, Users, X } from 'lucide-react';
import { affiliateApi } from '../lib/api';
import { useTheme, ui } from '../lib/ui';
import { SectionHead, LoadingBlock, EmptyBlock, ModalShell, FormField } from '../components/ui';
import { cn } from '../lib/cn';

export function AffiliatePanel() {
  const isDark = useTheme();
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', code: '', commissionRate: 10 });
  const [error, setError] = useState('');

  useEffect(() => {
    affiliateApi.list().then(setAffiliates).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const affiliate = await affiliateApi.create({ ...form, commissionRate: Number(form.commissionRate) });
      setAffiliates([affiliate, ...affiliates]);
      setOpen(false);
      setForm({ name: '', email: '', code: '', commissionRate: 10 });
    } catch (err) { setError(err.message); }
  };

  const remove = async (id) => {
    await affiliateApi.remove(id);
    setAffiliates(affiliates.filter((a) => a._id !== id));
  };

  return (
    <section className={ui.page}>
      <SectionHead
        eyebrow="AFFILIATE PROGRAM"
        title="Affiliate management"
        description="Track referrals, commissions, and partner payouts."
        isDark={isDark}
        action={
          <button type="button" className={ui.primary} onClick={() => setOpen(true)}>
            <Plus size={18}/>Add affiliate
          </button>
        }
      />
      {error && <p className={ui.formError}>{error}</p>}
      {loading ? (
        <LoadingBlock text="Loading affiliates..." isDark={isDark}/>
      ) : !affiliates.length ? (
        <EmptyBlock
          icon={<Users size={25}/>}
          title="Start your affiliate program"
          description="Add partners who refer customers and earn commissions."
          isDark={isDark}
        />
      ) : (
        <div className={ui.tableCard(isDark)}>
          <div className={cn(
            'grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 border-b px-5 py-3.5 text-[10px] font-bold uppercase tracking-wide',
            isDark ? 'border-violet-300/10 text-[#aaa4b9]' : 'border-violet-200/15 text-[#817b94]'
          )}>
            <span>Affiliate</span><span>Code</span><span>Referrals</span><span>Earnings</span><span/>
          </div>
          {affiliates.map((a) => (
            <div
              className={cn(
                'grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-3 border-b px-5 py-3.5 text-xs last:border-0',
                isDark ? 'border-violet-300/10' : 'border-violet-200/15'
              )}
              key={a._id}
            >
              <div>
                <b className="block">{a.name}</b>
                <small className={cn('mt-0.5 block text-[10px]', ui.muted(isDark))}>{a.email}</small>
              </div>
              <span className={ui.pill('active')}>{a.code}</span>
              <span>{a.referrals}</span>
              <span>${a.earnings.toFixed(2)}</span>
              <button type="button" className="cursor-pointer border-0 bg-transparent text-violet-300" onClick={() => remove(a._id)}>
                <Trash2 size={14}/>
              </button>
            </div>
          ))}
        </div>
      )}
      {open && (
        <ModalShell isDark={isDark} onClose={() => setOpen(false)}>
          <button type="button" className={ui.closeBtn(isDark)} onClick={() => setOpen(false)}><X size={19}/></button>
          <form onSubmit={submit}>
            <h2 className={ui.h2}>Add affiliate</h2>
            <FormField label="Name" isDark={isDark}>
              <input required className={ui.input(isDark)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/>
            </FormField>
            <FormField label="Email" isDark={isDark}>
              <input required type="email" className={ui.input(isDark)} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/>
            </FormField>
            <FormField label="Referral code" isDark={isDark}>
              <input required className={ui.input(isDark)} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}/>
            </FormField>
            <FormField label="Commission %" isDark={isDark}>
              <input type="number" min="0" max="100" className={ui.input(isDark)} value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}/>
            </FormField>
            <button type="submit" className={cn(ui.primary, ui.wide)}>Add affiliate</button>
          </form>
        </ModalShell>
      )}
    </section>
  );
}
