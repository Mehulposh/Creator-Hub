import { ArrowRight, BarChart3, Bot, CircleDollarSign, Sparkles, Store, Users, Zap } from 'lucide-react';

const features = [
  { icon: Store, title: 'Link-in-bio storefront', text: 'Sell digital products from a beautiful, branded page with custom links and social integration.' },
  { icon: Bot, title: 'AI Studio & agents', text: 'Six specialized AI agents for content, marketing, sales, support, analytics, and strategy.' },
  { icon: CircleDollarSign, title: 'Commerce & checkout', text: 'Stripe payments, coupons, digital delivery, and order tracking built in.' },
  { icon: Users, title: 'CRM & email', text: 'Manage contacts, send campaigns, and automate your creator growth workflows.' },
  { icon: BarChart3, title: 'Analytics dashboard', text: 'Track revenue, conversions, and business performance in real time.' },
  { icon: Zap, title: 'AI generators', text: 'Generate products, websites, and brand kits with a single prompt.' }
];

export function LandingPage({ onLogin, onRegister }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0d0b14] font-sans text-[#f4f1fb]">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d8c9ff12] bg-[#0d0b14cc] px-10 py-[18px] backdrop-blur-[12px] max-md:px-5 max-md:py-3.5">
        <a href="/" className="flex items-center gap-2 font-display text-[22px] font-bold text-inherit no-underline">
          <span className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-[#9b79fa] text-white"><Sparkles size={18}/></span>
          creator<span className="text-[#9c7cff]">hub</span>
        </a>
        <nav className="flex items-center gap-5">
          <a href="#features" className="text-sm text-[#b5acbf] no-underline max-md:hidden">Features</a>
          <a href="#pricing" className="text-sm text-[#b5acbf] no-underline max-md:hidden">Pricing</a>
          <a href="/customer" className="text-sm text-[#b5acbf] no-underline max-md:hidden">My Library</a>
          <button type="button" className="cursor-pointer rounded-[10px] border-0 bg-transparent px-4 py-[9px] text-[13px] font-semibold text-[#d8c9ff]" onClick={onLogin}>Sign in</button>
          <button type="button" className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[#9b79fa] to-[#7451d9] px-4 py-[9px] text-[13px] font-semibold text-white" onClick={onRegister}>Get started free</button>
        </nav>
      </header>

      <section className="relative mx-auto max-w-[900px] px-6 pb-20 pt-[100px] text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 bg-[radial-gradient(circle,#8964dc44,transparent_70%)]"/>
        <p className="mb-3 text-[11px] font-bold tracking-[0.12em] text-[#aa8eff]">AI-POWERED CREATOR PLATFORM</p>
        <h1 className="relative m-0 mb-5 font-display text-[clamp(36px,6vw,58px)] font-semibold leading-[1.08] tracking-[-2px]">
          Your entire creator business,<br/>in <em className="bg-gradient-to-br from-[#c4a8ff] to-[#9b79fa] bg-clip-text not-italic text-transparent">one intelligent hub.</em>
        </h1>
        <p className="mx-auto mb-8 max-w-[560px] text-[17px] leading-[1.7] text-[#b5acbf]">
          Sell products, run courses, manage customers, and grow with AI — without juggling a dozen different tools.
        </p>
        <div className="mb-12 flex flex-wrap justify-center gap-3.5">
          <button type="button" className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-0 bg-gradient-to-br from-[#9b79fa] to-[#7451d9] px-6 py-3.5 text-[15px] font-semibold text-white" onClick={onRegister}>
            Start for free <ArrowRight size={18}/>
          </button>
          <button type="button" className="cursor-pointer rounded-xl border border-[#d8c9ff33] bg-transparent px-6 py-3.5 text-[15px] font-semibold text-[#f4f1fb]" onClick={onLogin}>Sign in to workspace</button>
        </div>
        <div className="flex flex-wrap justify-center gap-12">
          <div><b className="block font-display text-[28px] font-semibold text-[#f4f1fb]">10+</b><span className="text-xs text-[#8a8199]">Business tools</span></div>
          <div><b className="block font-display text-[28px] font-semibold text-[#f4f1fb]">6</b><span className="text-xs text-[#8a8199]">AI agents</span></div>
          <div><b className="block font-display text-[28px] font-semibold text-[#f4f1fb]">1</b><span className="text-xs text-[#8a8199]">Dashboard</span></div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-10 py-20 text-center max-md:px-5 max-md:py-[60px]" id="features">
        <p className="mb-3 text-[11px] font-bold tracking-[0.12em] text-[#aa8eff]">EVERYTHING YOU NEED</p>
        <h2 className="mb-10 font-display text-[32px] font-semibold tracking-[-1px]">Built for creators who want to scale</h2>
        <div className="grid grid-cols-3 gap-5 text-left max-md:grid-cols-1">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-[#d8c9ff14] bg-[#1a1528] p-6">
              <span className="mb-3.5 grid h-11 w-11 place-items-center rounded-xl bg-[#a98aff1a] text-[#b79fff]"><Icon size={22}/></span>
              <h3 className="m-0 mb-2 font-display text-base font-semibold">{title}</h3>
              <p className="m-0 text-[13px] leading-[1.6] text-[#b5acbf]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[800px] px-10 py-20 text-center max-md:px-5 max-md:py-[60px]" id="pricing">
        <p className="mb-3 text-[11px] font-bold tracking-[0.12em] text-[#aa8eff]">SIMPLE PRICING</p>
        <h2 className="mb-10 font-display text-[32px] font-semibold">Start free, upgrade when you grow</h2>
        <div className="grid grid-cols-2 gap-5 text-left max-md:grid-cols-1">
          <article className="relative rounded-[18px] border border-[#d8c9ff14] bg-[#1a1528] p-7">
            <h3 className="m-0 mb-2 font-display text-xl font-semibold">Starter</h3>
            <p className="m-0 mb-5 font-display text-[36px] font-semibold">$0<span className="font-sans text-sm font-normal text-[#8a8199]">/mo</span></p>
            <ul className="m-0 mb-6 list-none p-0 text-[13px] leading-8 text-[#b5acbf]"><li>Link-in-bio storefront</li><li>Digital product sales</li><li>AI assistant</li><li>Basic analytics</li></ul>
            <button type="button" className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[#9b79fa] to-[#7451d9] px-4 py-[9px] text-[13px] font-semibold text-white" onClick={onRegister}>Get started</button>
          </article>
          <article className="relative rounded-[18px] border border-[#9b79fa66] bg-gradient-to-b from-[#1f1933] to-[#1a1528] p-7">
            <span className="absolute right-4 top-4 rounded-md bg-[#9b79fa22] px-2 py-1 text-[10px] font-bold text-[#b79fff]">Popular</span>
            <h3 className="m-0 mb-2 font-display text-xl font-semibold">Pro</h3>
            <p className="m-0 mb-5 font-display text-[36px] font-semibold">$29<span className="font-sans text-sm font-normal text-[#8a8199]">/mo</span></p>
            <ul className="m-0 mb-6 list-none p-0 text-[13px] leading-8 text-[#b5acbf]"><li>Everything in Starter</li><li>AI Studio & all agents</li><li>Email campaigns</li><li>Courses & memberships</li><li>Priority support</li></ul>
            <button type="button" className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[#9b79fa] to-[#7451d9] px-4 py-[9px] text-[13px] font-semibold text-white" onClick={onRegister}>Start Pro trial</button>
          </article>
        </div>
      </section>

      <section className="px-6 py-20 text-center [background:radial-gradient(circle_at_50%_50%,#37245455,transparent_60%)]">
        <h2 className="m-0 mb-3 font-display text-[32px] font-semibold">Ready to build your creator empire?</h2>
        <p className="mb-7 text-[#b5acbf]">Join thousands of creators selling smarter with AI Creator Hub.</p>
        <button type="button" className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-0 bg-gradient-to-br from-[#9b79fa] to-[#7451d9] px-6 py-3.5 text-[15px] font-semibold text-white" onClick={onRegister}>Create your workspace <ArrowRight size={18}/></button>
      </section>

      <footer className="flex items-center justify-between border-t border-[#d8c9ff12] px-10 py-6 text-[13px] text-[#8a8199] max-md:px-5">
        <span className="flex items-center gap-1.5"><Sparkles size={16}/> creatorhub</span>
        <small>© 2026 AI Creator Hub. All rights reserved.</small>
      </footer>
    </div>
  );
}
