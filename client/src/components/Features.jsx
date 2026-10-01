import { motion } from 'framer-motion';
import { Rocket, Activity, DollarSign, Brain, GitPullRequest, Shield } from 'lucide-react';

/*
  Design decision: Instead of 6 identical rounded cards (the SaaS-card default),
  this uses an asymmetric bento grid where featured items take more space.
  Two large featured cells (Deployment Readiness + AI Investigation) sit beside
  a column of four compact cells. This creates visual hierarchy that reflects
  which features actually matter most.
*/

const primary = [
  {
    icon: Rocket,
    title: 'Deployment readiness',
    desc: 'Before you deploy, we check your environment variables, framework config, health endpoints, and potential AWS cost risks. Fix problems before they break production.',
    tag: '12 checks',
    large: true,
    accent: 'indigo',
  },
  {
    icon: Brain,
    title: 'AI incident investigation',
    desc: 'When something breaks, AI correlates events across GitHub, Vercel, AWS, and your database into one timeline — then explains the root cause in plain English.',
    tag: '< 60s to explain',
    large: true,
    accent: 'violet',
  },
];

const secondary = [
  { icon: Activity,       title: 'Real-time monitoring',  desc: 'Latency, errors, CPU, and DB health across your entire stack.' },
  { icon: DollarSign,     title: 'Cost awareness',        desc: 'Catch runaway AWS charges before the bill arrives.' },
  { icon: GitPullRequest, title: 'Suggested fixes',       desc: 'AI proposes code changes. You review and merge.' },
  { icon: Shield,         title: 'Approval-first',        desc: 'Every deployment and action requires your explicit approval.' },
];

const accentMap = {
  indigo: {
    bg: 'bg-indigo-500/8',
    border: 'border-indigo-500/15 hover:border-indigo-500/30',
    icon: 'bg-indigo-500/15 text-indigo-400',
    tag: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  },
  violet: {
    bg: 'bg-violet-500/8',
    border: 'border-violet-500/15 hover:border-violet-500/30',
    icon: 'bg-violet-500/15 text-violet-400',
    tag: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
  },
};

const Features = () => {
  return (
    <section
      className="py-28 bg-[#080c18]"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[12px] font-bold text-indigo-400 uppercase tracking-[0.12em] mb-3">
            Features
          </p>
          <h2
            className="text-[36px] md:text-[48px] font-black text-white leading-[1.08]
              tracking-[-0.03em] max-w-xl"
          >
            DevOps superpowers.<br />No DevOps required.
          </h2>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left column — two large featured cards stacked */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {primary.map((f, i) => {
              const acc = accentMap[f.accent];
              return (
                <motion.div
                  key={i}
                  className={`rounded-2xl border p-6 transition-all duration-300 cursor-default
                    ${acc.bg} ${acc.border}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${acc.icon}`}>
                    <f.icon size={20} />
                  </div>
                  <h3 className="text-[17px] font-black text-white tracking-tight mb-2">
                    {f.title}
                  </h3>
                  <p className="text-[13.5px] text-gray-400 leading-relaxed mb-5">
                    {f.desc}
                  </p>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${acc.tag}`}>
                    <span className="w-1 h-1 rounded-full bg-current opacity-70" />
                    {f.tag}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right column — four compact cells */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {secondary.map((f, i) => (
              <motion.div
                key={i}
                className="rounded-2xl border border-white/[0.07] hover:border-white/[0.13]
                  bg-white/[0.02] hover:bg-white/[0.04] p-5 transition-all duration-300 cursor-default"
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                whileHover={{ y: -1 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center
                    justify-center flex-shrink-0 mt-0.5">
                    <f.icon size={16} className="text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-black text-white tracking-tight mb-1">
                      {f.title}
                    </h3>
                    <p className="text-[12.5px] text-gray-500 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default Features;