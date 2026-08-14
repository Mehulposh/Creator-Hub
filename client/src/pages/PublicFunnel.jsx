import { useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle } from 'lucide-react';
import { storefrontApi } from '../lib/api';

export function PublicFunnel({ slug }) {
  const [funnel, setFunnel] = useState(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leadForm, setLeadForm] = useState({ name: '', email: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    storefrontApi.getFunnel(slug)
      .then(setFunnel)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const current = funnel?.steps?.[step];
  const theme = funnel?.creator?.themeColor || '#8b5cf6';

  const next = async () => {
    if (step < (funnel?.steps?.length || 1) - 1) {
      setStep(step + 1);
    } else {
      await storefrontApi.funnelConvert(slug);
    }
  };

  const submitLead = async (e) => {
    e.preventDefault();
    try {
      await storefrontApi.funnelLead(slug, leadForm);
      setSubmitted(true);
      next();
    } catch (err) { setError(err.message); }
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#110e1a] text-white">
        <LoaderCircle className="animate-spin" size={28}/>
      </main>
    );
  }

  if (error || !funnel) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#110e1a] px-6 text-center text-white">
        <p>{error || 'Funnel not found'}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#110e1a] text-[#f7f4ff]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <header className="border-b border-violet-300/10 px-6 py-4 text-center">
        <p className="text-xs text-violet-400">{funnel.creator?.storeName || funnel.creator?.name}</p>
        <h1 className="font-display text-2xl font-semibold">{funnel.name}</h1>
        <div className="mt-3 flex justify-center gap-2">
          {funnel.steps.map((s, i) => (
            <span key={i} className={`h-1.5 w-8 rounded-full ${i <= step ? 'bg-violet-500' : 'bg-violet-500/20'}`}/>
          ))}
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-12">
        {current?.type === 'lead_capture' && !submitted ? (
          <form onSubmit={submitLead} className="rounded-2xl border border-violet-300/15 bg-[#211b31] p-8">
            <h2 className="font-display text-xl font-semibold">{current.name}</h2>
            <p className="mt-2 text-sm text-[#b5acbf]">{current.content || 'Enter your details to continue.'}</p>
            <input required className="mt-4 w-full rounded-lg border border-violet-300/15 bg-[#110e1a] px-3 py-2.5 text-sm" placeholder="Your name" value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}/>
            <input required type="email" className="mt-3 w-full rounded-lg border border-violet-300/15 bg-[#110e1a] px-3 py-2.5 text-sm" placeholder="Email address" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}/>
            <button type="submit" className="mt-4 w-full rounded-lg py-3 text-sm font-semibold text-white" style={{ background: theme }}>Continue</button>
          </form>
        ) : (
          <article className="rounded-2xl border border-violet-300/15 bg-[#211b31] p-8">
            <h2 className="font-display text-xl font-semibold">{current?.name || 'Step'}</h2>
            <div className="prose prose-invert mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#c5bdd7]">
              {current?.content || 'Welcome to this funnel step.'}
            </div>
            {current?.type === 'thank_you' ? (
              <p className="mt-6 flex items-center gap-2 text-emerald-400"><CheckCircle2 size={18}/> Thank you!</p>
            ) : (
              <button type="button" onClick={next} className="mt-6 rounded-lg px-6 py-3 text-sm font-semibold text-white" style={{ background: theme }}>
                {step < funnel.steps.length - 1 ? 'Continue' : 'Finish'}
              </button>
            )}
          </article>
        )}
      </section>
    </main>
  );
}
