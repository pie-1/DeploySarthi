import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { GitBranch, ShieldCheck, Activity, Brain } from 'lucide-react';

/*
  Design decision: Instead of four isolated cards (the generic default),
  this renders as a connected vertical timeline on mobile and a
  horizontal connected flow on desktop. The connector line between
  steps grows as the section scrolls into view — this is purposeful
  motion that shows causation rather than just listing features.
*/

const steps = [
  {
    icon: GitBranch,
    number: '01',
    title: 'Connect your repo',
    desc: 'Link your GitHub repository in one click. DeploySarthi reads your code structure, detects your framework, and identifies missing environment variables before you do.',
    metric: '< 30 sec setup',
  },
  {
    icon: ShieldCheck,
    number: '02',
    title: 'Run the readiness check',
    desc: 'We scan for missing env vars, security risks, missing health endpoints, and potential AWS cost risks before a single resource is created.',
    metric: '12 checks run',
  },
  {
    icon: Activity,
    number: '03',
    title: 'Deploy and monitor',
    desc: 'One approval click deploys to Vercel or AWS App Runner. Monitoring starts automatically — latency, errors, CPU, cost, and database health.',
    metric: '24/7 monitoring',
  },
  {
    icon: Brain,
    number: '04',
    title: 'Understand what broke',
    desc: 'When an incident happens, AI correlates events across all your services and explains the root cause in plain English with a suggested fix.',
    metric: '< 60s to explain',
  },
];

const HowItWorks = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.3'],
  });

  // Connector line grows as you scroll through the section
  const lineWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section
      ref={ref}
      className="py-28 bg-[#060a14]"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[12px] font-bold text-indigo-400 uppercase tracking-[0.12em] mb-3">
            How it works
          </p>
          <h2
            className="text-[36px] md:text-[48px] font-black text-white leading-[1.08]
              tracking-[-0.03em] max-w-lg"
          >
            From code to production in four steps.
          </h2>
        </motion.div>

        {/* Desktop: horizontal connected flow */}
        <div className="hidden md:block relative">

          {/* Animated connector line */}
          <div className="absolute top-[52px] left-[12.5%] right-[12.5%] h-px bg-white/[0.06]">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500/60 via-indigo-400/60 to-violet-500/60"
              style={{ width: lineWidth }}
            />
          </div>

          <div className="grid grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="relative pt-0"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
              >
                {/* Icon node on the connector line */}
                <div className="flex justify-center mb-8">
                  <div
                    className="w-[52px] h-[52px] rounded-2xl border border-white/[0.1] bg-[#0d1117]
                      flex items-center justify-center relative z-10
                      shadow-xl shadow-black/30"
                  >
                    <step.icon size={22} className="text-indigo-400" />
                  </div>
                </div>

                {/* Content */}
                <div className="text-center px-2">
                  <div className="text-[11px] font-black text-indigo-500/60 tracking-[0.1em] mb-2">
                    {step.number}
                  </div>
                  <h3 className="text-[15px] font-black text-white tracking-tight mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed mb-4">
                    {step.desc}
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                    bg-indigo-500/8 border border-indigo-500/15">
                    <span className="w-1 h-1 rounded-full bg-indigo-400" />
                    <span className="text-[11px] font-semibold text-indigo-400">
                      {step.metric}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="md:hidden relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-3 top-4 bottom-4 w-px bg-white/[0.06]" />

          <div className="space-y-10">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="relative"
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                {/* Dot on vertical line */}
                <div className="absolute -left-8 top-0 w-6 h-6 rounded-lg border border-indigo-500/30
                  bg-[#0d1117] flex items-center justify-center">
                  <step.icon size={12} className="text-indigo-400" />
                </div>

                <div className="text-[11px] font-black text-indigo-500/50 tracking-[0.1em] mb-1">
                  {step.number}
                </div>
                <h3 className="text-[15px] font-black text-white tracking-tight mb-1.5">
                  {step.title}
                </h3>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-3">
                  {step.desc}
                </p>
                <span className="text-[11px] font-semibold text-indigo-400">{step.metric}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;