import { motion } from 'framer-motion';
import { Rocket, Activity, DollarSign, Brain, GitPullRequest, Shield } from 'lucide-react';

const primary = [
  {
    icon: Rocket,
    title: 'Deployment readiness',
    desc: 'Before you deploy, we check your environment variables, framework config, health endpoints, and potential AWS cost risks. Fix problems before they reach production.',
    tag: '12 checks',
    color: 'indigo',
    stat: { value: '94%', label: 'of deploy failures caught early' },
  },
  {
    icon: Brain,
    title: 'AI incident investigation',
    desc: 'When something breaks, AI correlates events across GitHub, Vercel, AWS, and your database into one causal timeline — then explains what happened in plain English.',
    tag: '< 60s',
    color: 'violet',
    stat: { value: '3x', label: 'faster incident resolution' },
  },
];

const secondary = [
  {
    icon: Activity,
    title: 'Real-time monitoring',
    desc: 'Latency, errors, CPU, and DB health across your stack.',
    tag: 'Live',
  },
  {
    icon: DollarSign,
    title: 'Cost awareness',
    desc: 'Catch runaway AWS charges before the bill arrives.',
    tag: 'Proactive',
  },
  {
    icon: GitPullRequest,
    title: 'Suggested fixes',
    desc: 'AI proposes code changes. You review and merge.',
    tag: 'AI-powered',
  },
  {
    icon: Shield,
    title: 'Approval-first',
    desc: 'Every deployment requires your explicit approval.',
    tag: 'Safe by default',
  },
];

const primaryColors = [
  {
    card: 'bg-indigo-500/[0.08] border-indigo-500/25 hover:border-indigo-500/45',
    icon: 'bg-indigo-500/15 text-indigo-300',
    tag: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200',
    stat: 'text-indigo-200',
    statLabel: 'text-indigo-300/80',
  },
  {
    card: 'bg-violet-500/[0.08] border-violet-500/25 hover:border-violet-500/45',
    icon: 'bg-violet-500/15 text-violet-300',
    tag: 'bg-violet-500/10 border-violet-500/30 text-violet-200',
    stat: 'text-violet-200',
    statLabel: 'text-violet-300/80',
  },
];

const Features = () => {
  return (
    <section
      className="relative py-32 bg-[#0c1024] overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px]
        bg-indigo-600/6 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px]
        bg-violet-600/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full
            border border-violet-500/25 bg-violet-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="text-[11.5px] font-bold text-violet-300 uppercase tracking-[0.12em]">
              Features
            </span>
          </div>
          <h2 className="text-[38px] md:text-[56px] font-black text-white leading-[1.05]
            tracking-[-0.035em] max-w-2xl">
            DevOps superpowers.
            <br />
            <span className="text-gray-400">No DevOps required.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {primary.map((f, i) => {
              const c = primaryColors[i];
              return (
                <motion.div
                  key={i}
                  className={`rounded-2xl border p-6 transition-all duration-300 cursor-default
                    flex flex-col backdrop-blur-sm ${c.card}`}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -3 }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${c.icon}`}>
                    <f.icon size={20} />
                  </div>

                  <h3 className="text-[17px] font-black text-white tracking-tight mb-3">
                    {f.title}
                  </h3>
                  <p className="text-[13.5px] text-gray-300 leading-[1.75] mb-5 flex-1">
                    {f.desc}
                  </p>

                  <div className="flex items-end justify-between mt-auto pt-4
                    border-t border-white/[0.1]">
                    <div>
                      <div className={`text-[24px] font-black leading-none mb-0.5 ${c.stat}`}>
                        {f.stat.value}
                      </div>
                      <div className={`text-[11px] font-medium ${c.statLabel}`}>
                        {f.stat.label}
                      </div>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-[5px]
                      rounded-full border text-[11px] font-bold ${c.tag}`}>
                      <span className="w-1 h-1 rounded-full bg-current opacity-80" />
                      {f.tag}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {secondary.map((f, i) => (
              <motion.div
                key={i}
                className="rounded-xl border border-white/[0.1] hover:border-white/[0.18]
                  bg-white/[0.03] hover:bg-white/[0.05] p-4 transition-all duration-250
                  cursor-default group backdrop-blur-sm"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -1 }}
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.06] group-hover:bg-white/[0.1]
                    flex items-center justify-center transition-colors flex-shrink-0">
                    <f.icon size={14} className="text-gray-300 group-hover:text-white
                      transition-colors" />
                  </div>
                  <h3 className="text-[13.5px] font-black text-white tracking-tight">
                    {f.title}
                  </h3>
                </div>
                <p className="text-[12.5px] text-gray-400 leading-relaxed mb-3 pl-10">
                  {f.desc}
                </p>
                <div className="pl-10">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                    bg-white/[0.06] border border-white/[0.1] text-[10.5px] font-semibold
                    text-gray-300">
                    {f.tag}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Transition to Footer */}
      <div className="absolute bottom-0 inset-x-0 h-24
        bg-gradient-to-b from-transparent to-[#060a14] pointer-events-none" />
    </section>
  );
};

export default Features;