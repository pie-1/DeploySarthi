import { motion } from 'framer-motion';
import { Rocket, Activity, DollarSign, Brain, GitPullRequest, Shield } from 'lucide-react';

const primary = [
  {
    icon: Rocket,
    title: 'Deployment readiness',
    desc: 'Before you deploy, we check your environment variables, framework config, health endpoints, and potential AWS cost risks.',
    tag: '12 checks',
  },
  {
    icon: Brain,
    title: 'AI incident investigation',
    desc: 'When something breaks, AI correlates events across GitHub, Vercel, AWS, and your database into one timeline.',
    tag: '< 60s to explain',
  },
];

const secondary = [
  {
    icon: Activity,
    title: 'Real-time monitoring',
    desc: 'Latency, errors, CPU, and DB health across your entire stack.',
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
    desc: 'Every deployment and action requires your explicit approval.',
    tag: 'Safe',
  },
];

const Features = () => {
  return (
    <section
      className="relative py-28 bg-[#080c18]"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Gradient transition from HowItWorks */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#060a14] to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.15em] mb-3">
            Features
          </p>
          <h2
            className="text-[36px] md:text-[52px] font-black text-white leading-[1.05]
              tracking-[-0.03em] max-w-xl"
          >
            DevOps superpowers.
            <br />
            No DevOps required.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: two large featured cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {primary.map((f, i) => (
              <motion.div
                key={i}
                className={`rounded-2xl border p-6 transition-all duration-300 cursor-default
                  ${i === 0
                    ? 'bg-indigo-500/8 border-indigo-500/15 hover:border-indigo-500/30'
                    : 'bg-violet-500/8 border-violet-500/15 hover:border-violet-500/30'
                  }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -2 }}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5
                    ${i === 0
                      ? 'bg-indigo-500/15 text-indigo-400'
                      : 'bg-violet-500/15 text-violet-400'
                    }`}
                >
                  <f.icon size={20} />
                </div>
                <h3 className="text-[17px] font-black text-white tracking-tight mb-2">
                  {f.title}
                </h3>
                <p className="text-[13.5px] text-gray-400 leading-relaxed mb-5">
                  {f.desc}
                </p>

                <motion.div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border
                    text-[11px] font-bold
                    ${i === 0
                      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                      : 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                    }`}
                  whileHover={{ scale: 1.05 }}
                  data-cursor-hover
                >
                  <span className="w-1 h-1 rounded-full bg-current opacity-70" />
                  {f.tag}
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Right: four compact cells */}
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
                  <div
                    className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center
                      justify-center flex-shrink-0 mt-0.5"
                  >
                    <f.icon size={16} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-black text-white tracking-tight mb-1">
                      {f.title}
                    </h3>
                    <p className="text-[12.5px] text-gray-500 leading-relaxed mb-3">
                      {f.desc}
                    </p>
                    <div
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full
                        bg-white/[0.04] border border-white/[0.08]"
                    >
                      <span className="w-1 h-1 rounded-full bg-gray-500" />
                      <span className="text-[10px] font-semibold text-gray-400">
                        {f.tag}
                      </span>
                    </div>
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