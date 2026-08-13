import { useEffect, useState } from 'react';
import {
  Copy,
  ExternalLink,
  Plus,
  ShoppingBag,
  Tag,
  X,
} from 'lucide-react';

import { commerceApi, couponApi } from '../lib/api';
import { useTheme, ui } from '../lib/ui';
import { SectionHead, LoadingBlock, ModalShell, FormField, StatusPill } from '../components/ui';
import { cn } from '../lib/cn';

export function CommercePanel({ user }) {
  const isDark = useTheme();
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'percent', discountValue: 10 });

  const storeUrl = `${window.location.origin}/store/${user.storeSlug || user.id}`;

  useEffect(() => {
    Promise.all([commerceApi.orders(), couponApi.list()])
      .then(([o, c]) => { setOrders(o); setCoupons(c); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const createCoupon = async (e) => {
    e.preventDefault();
    try {
      const coupon = await couponApi.create({ ...couponForm, discountValue: Number(couponForm.discountValue) });
      setCoupons([coupon, ...coupons]);
      setCouponOpen(false);
    } catch (err) { setError(err.message); }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Failed to copy storefront link.');
    }
  };

  const tableHead = cn(
    'border-b text-left text-[10px] font-bold uppercase tracking-wide',
    isDark ? 'border-violet-300/10 text-[#aaa4b9]' : 'border-violet-200/15 text-[#817b94]'
  );

  const tableCell = cn(
    'border-b px-4 py-3.5 text-sm last:border-0',
    isDark ? 'border-violet-300/10' : 'border-violet-200/15'
  );

  return (
    <section className={cn(ui.page, 'space-y-4')}>
      <SectionHead
        isDark={isDark}
        eyebrow="COMMERCE OPERATIONS"
        title="Storefront & orders"
        description="Share your storefront and keep a clear eye on every sale."
        action={<ShoppingBag size={28} className={isDark ? 'text-violet-300' : 'text-violet-500'} />}
      />

      {/* Storefront */}
      <div className={cn(ui.card(isDark), 'p-5')}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className={ui.h3}>Your public storefront</h2>
            <p className={ui.muted(isDark)}>Share this link with your audience.</p>
          </div>
          <ExternalLink size={20} className={isDark ? 'text-violet-300' : 'text-violet-500'} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className={cn(
              'min-w-0 flex-1 truncate rounded-lg border px-3 py-2.5 font-mono text-xs',
              isDark ? 'border-violet-300/15 bg-[#110f1a] text-violet-200' : 'border-violet-200/30 bg-[#f6f6fb] text-[#28243b]'
            )}
          >
            {storeUrl}
          </div>

          <button type="button" className={ui.secondary(isDark)} onClick={copy}>
            <Copy size={16} />
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>

        <a
          href={storeUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(
            'mt-4 inline-flex items-center gap-1.5 text-xs font-semibold no-underline',
            isDark ? 'text-violet-300 hover:text-violet-200' : 'text-violet-600 hover:text-violet-700'
          )}
        >
          Open storefront
          <ExternalLink size={15} />
        </a>
      </div>

      {/* Coupons */}
      <div className={cn(ui.card(isDark), 'p-5')}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className={ui.h3}>Discount coupons</h2>
            <p className={ui.muted(isDark)}>Create promo codes for your storefront.</p>
          </div>
          <button type="button" className={ui.secondary(isDark)} onClick={() => setCouponOpen(true)}>
            <Plus size={16} /> New coupon
          </button>
        </div>

        {coupons.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse">
              <thead>
                <tr className={tableHead}>
                  <th className="px-4 py-3 font-bold">Code</th>
                  <th className="px-4 py-3 font-bold">Discount</th>
                  <th className="px-4 py-3 font-bold">Uses</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c._id}>
                    <td className={tableCell}>
                      <span className="inline-flex items-center gap-1.5">
                        <Tag size={14} className="shrink-0 text-violet-400" />
                        {c.code}
                      </span>
                    </td>
                    <td className={tableCell}>
                      {c.discountType === 'percent' ? `${c.discountValue}%` : `$${c.discountValue}`}
                    </td>
                    <td className={tableCell}>
                      {c.uses}{c.maxUses ? ` / ${c.maxUses}` : ''}
                    </td>
                    <td className={tableCell}>
                      <StatusPill status={c.active ? 'active' : 'inactive'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={cn('py-8 text-center text-sm', ui.muted(isDark))}>
            No coupons yet. Create one to offer discounts.
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Orders */}
      <div className={cn(ui.card(isDark), 'p-5')}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className={ui.h3}>Orders</h2>
            <p className={ui.muted(isDark)}>Recent purchases from your storefront.</p>
          </div>
          {!loading && (
            <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-100 text-violet-700')}>
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </span>
          )}
        </div>

        {loading ? (
          <LoadingBlock text="Loading orders..." isDark={isDark} />
        ) : orders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className={tableHead}>
                  <th className="px-4 py-3 font-bold">Order</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Product</th>
                  <th className="px-4 py-3 font-bold">Amount</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className={tableCell}>#{order._id.slice(-7).toUpperCase()}</td>
                    <td className={tableCell}>{order.buyerEmail}</td>
                    <td className={tableCell}>
                      {order.product?.title || order.course?.title || (order.itemType === 'course' ? 'Course' : 'Product')}
                    </td>
                    <td className={tableCell}>${Number(order.amount || 0).toFixed(2)}</td>
                    <td className={tableCell}>
                      <StatusPill status={order.status || 'pending'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={cn('flex flex-col items-center py-16 text-center', ui.muted(isDark))}>
            <ShoppingBag size={32} className="mb-4 text-violet-400" />
            <h3 className={cn('mb-2 font-display text-base font-semibold', isDark ? 'text-[#f4f1fb]' : 'text-[#28243b]')}>
              No orders yet
            </h3>
            <p className="max-w-sm text-sm leading-relaxed">
              Publish a product and share your storefront to begin selling.
            </p>
          </div>
        )}
      </div>

      {couponOpen && (
        <ModalShell isDark={isDark} onClose={() => setCouponOpen(false)}>
          <form className="max-w-[420px]" onSubmit={createCoupon}>
            <button type="button" className={ui.closeBtn(isDark)} onClick={() => setCouponOpen(false)}>
              <X size={19} />
            </button>
            <h2 className={ui.h2}>Create coupon</h2>

            <FormField label="Code" isDark={isDark}>
              <input
                required
                className={ui.input(isDark)}
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
              />
            </FormField>

            <div className={ui.formRow}>
              <FormField label="Type" isDark={isDark}>
                <select
                  className={ui.input(isDark)}
                  value={couponForm.discountType}
                  onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                >
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </FormField>
              <FormField label="Value" isDark={isDark}>
                <input
                  required
                  type="number"
                  min="0"
                  className={ui.input(isDark)}
                  value={couponForm.discountValue}
                  onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                />
              </FormField>
            </div>

            <button type="submit" className={cn(ui.primary, ui.wide)}>Create coupon</button>
          </form>
        </ModalShell>
      )}
    </section>
  );
}
