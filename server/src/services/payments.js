const PLACEHOLDER_PATTERNS = [/your_stripe/i, /replace/i, /example/i, /_key$/];

export function useSimulatedPayments() {
  if (process.env.PAYMENT_MODE === 'stripe') return false;
  if (process.env.PAYMENT_MODE === 'simulate') return true;
  const key = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (!key) return true;
  if (!/^sk_(test|live)_/.test(key)) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(key));
}

export function paymentMode() {
  return useSimulatedPayments() ? 'simulate' : 'stripe';
}

export async function simulatePayment({ orders, items, affiliateCode, fulfillOrder }) {
  await new Promise((resolve) => setTimeout(resolve, 800));
  for (const { order, item } of orders) {
    order.paymentProvider = 'manual';
    order.paymentReference = `sim_${order.cartSessionId || order.id}`;
    await fulfillOrder(order, item, affiliateCode);
  }
  return {
    simulated: true,
    message: 'Payment simulated successfully. No real charge was made.'
  };
}
