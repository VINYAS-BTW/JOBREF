import { motion } from 'framer-motion'
import { ArrowRight, Shield, Zap, BarChart2, Lock, ChevronRight, Users, TrendingUp } from 'lucide-react'

const STATS = [
  { value: '3.2×', label: 'higher interview rate via referral' },
  { value: '68%', label: 'of roles filled through networks' },
  { value: '41 days', label: 'faster time-to-hire' },
]

const PILLARS = [
  {
    icon: BarChart2,
    title: 'Proof-of-Work Profile',
    body: 'No PDFs. GitHub commits, LeetCode ratings, and live project signals auto-generate your competency heatmap.',
  },
  {
    icon: Zap,
    title: 'Probability Engine',
    body: 'AI calculates your referral match score before you send a single message. Know your odds. Move with intent.',
  },
  {
    icon: Lock,
    title: 'Zero-Knowledge Trust Layer',
    body: 'Employees browse as "Senior React Dev @ FinTech Unicorn." Identities reveal only on mutual opt-in.',
  },
  {
    icon: Shield,
    title: 'Token Economy',
    body: '3 referral tokens per month per candidate. Mathematically eliminates spam. Every request carries weight.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
}

export default function LandingPage({ navigate }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="min-h-screen"
    >
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/6 bg-[#111]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-widest uppercase text-[#C8FF00]">RefHire</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('auth', 'hiring')}
              className="text-sm text-[#6B6966] hover:text-[#A09E9A] transition-colors duration-200 px-3 py-1.5"
            >
              Hiring
            </button>
            <button
              type="button"
              onClick={() => navigate('auth', 'candidate')}
              className="text-sm text-[#A09E9A] hover:text-[#E8E6E1] transition-colors duration-200 px-3 py-1.5"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('auth', 'candidate')}
              className="text-sm bg-[#C8FF00] text-[#0A0A0B] font-semibold px-4 py-1.5 rounded-sm hover:bg-[#D4FF26] transition-colors duration-200"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-40 pb-28 px-6 max-w-6xl mx-auto">
        

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight text-[#E8E6E1] max-w-4xl mb-6"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          The referral network that{' '}
          <span className="text-[#C8FF00]">eliminates</span>{' '}
          the cold ask.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          className="text-lg text-[#6B6966] max-w-xl mb-10 leading-relaxed"
        >
          Proof-of-work profiles. Predictive match scores. Zero-knowledge identity.
          Referrals that work — without the awkward LinkedIn DMs.
        </motion.p>

        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('auth', 'candidate')}
            className="group flex items-center gap-2 bg-[#C8FF00] text-[#0A0A0B] font-semibold px-6 py-3 rounded-sm hover:bg-[#D4FF26] transition-colors duration-200 text-sm"
          >
            Find a referrer
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </button>
          <button
            onClick={() => navigate('auth', 'employee')}
            className="flex items-center gap-2 border border-white/10 text-[#A09E9A] hover:text-[#E8E6E1] hover:border-white/20 px-6 py-3 rounded-sm transition-colors duration-200 text-sm"
          >
            <Users size={14} />
            I want to refer talent
          </button>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="border-y border-white/6 bg-white/2">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-px">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              className="px-8 py-6 first:pl-0 last:pr-0"
            >
              <div
                className="text-4xl font-bold text-[#C8FF00] mb-1 tracking-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {s.value}
              </div>
              <div className="text-sm text-[#6B6966]">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PILLARS */}
      <section className="py-28 px-6 max-w-6xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mb-14"
        >
          <p className="text-xs tracking-widest uppercase text-[#C8FF00] mb-3">How it works</p>
          <h2
            className="text-3xl md:text-4xl font-bold text-[#E8E6E1] max-w-lg leading-snug"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Four systems. One unfair advantage.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/6">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i * 0.5}
              className="bg-[#111] p-8 hover:bg-white/2 transition-colors duration-300 group"
            >
              <div className="w-9 h-9 border border-[#C8FF00]/30 flex items-center justify-center mb-5 group-hover:border-[#C8FF00]/60 transition-colors duration-300">
                <p.icon size={16} className="text-[#C8FF00]" />
              </div>
              <h3 className="text-base font-semibold text-[#E8E6E1] mb-2">{p.title}</h3>
              <p className="text-sm text-[#6B6966] leading-relaxed">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="border border-white/8 p-12 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
        >
          <div>
            <h2
              className="text-3xl font-bold text-[#E8E6E1] mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Your next hire is already inside someone's network.
            </h2>
            <p className="text-[#6B6966] text-sm">Stop guessing. Start matching.</p>
          </div>
          <div className="flex flex-col gap-3 min-w-max">
            <button
              onClick={() => navigate('auth', 'candidate')}
              className="group flex items-center gap-2 bg-[#C8FF00] text-[#0A0A0B] font-semibold px-6 py-3 rounded-sm text-sm hover:bg-[#D4FF26] transition-colors duration-200"
            >
              Join as candidate <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => navigate('auth', 'employee')}
              className="group flex items-center gap-2 border border-white/10 text-[#A09E9A] hover:text-[#E8E6E1] px-6 py-3 rounded-sm text-sm transition-colors duration-200"
            >
              Join as referrer <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/6 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#C8FF00]">RefHire</span>
          <span className="text-xs text-[#3D3B38]">Privacy-first referral infrastructure</span>
        </div>
      </footer>
    </motion.div>
  )
}