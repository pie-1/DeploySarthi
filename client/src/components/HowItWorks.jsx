import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { GitBranch, ShieldCheck, Activity, Brain } from 'lucide-react';

const steps = [
  {
    icon: GitBranch,
    number: '01',
    title: 'Connect your repo',
    desc: 'Link GitHub in one click. We detect your framework and missing env vars automatically.',
    metric: '< 30 sec setup',
    color: 'indigo',
  },
  {
    icon: ShieldCheck,
    number: '02',
    title: 'Run readiness check',
    desc: 'We scan for missing env vars, security risks, and potential AWS cost issues before a single resource is created.',
    metric: '12 checks run',
    color: 'violet',
  },
  {
    icon: Activity,
    number: '03',
    title: 'Deploy and monitor',
    desc: 'One approval deploys to Vercel or AWS. Monitoring starts automatically — no extra config.',
    metric: '24/7 monitoring',
    color: 'blue',
  },
  {
    icon: Brain,
    number: '04',
    title: 'Understand what broke',
    desc: 'AI correlates events across all your services and explains the root cause in plain English.',
    metric: '< 60s to explain',
    color: 'indigo',
  },
];

const colorMap = {
  indigo: {
    ring: 'border-indigo-500/20 bg-indigo-500/8',
    icon: 'text-indigo-400',
    badge: 'bg-indigo-500/8 border-indigo-500/15 text-indigo-400',
    dot: 'bg-indigo-400',
    connector: '#818cf8',
  },
  violet: {
    ring: 'border-violet-500/20 bg-violet-500/8',
    icon: 'text-violet-400',
    badge: 'bg-violet-500/8 border-violet-500/15 text-violet-400',
    dot: 'bg-violet-400',
    connector: '#a78bfa',
  },
  blue: {
    ring: 'border-blue-500/20 bg-blue-500/8',
    icon: 'text-blue-400',
    badge: 'bg-blue-500/8 border-blue-500/15 text-blue-400',
    dot: 'bg-blue-400',
    connector: '#60a5fa',
  },
};

const HowItWorks = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'end 0.2'],
  });

  // Line fills left-to-right as you scroll
  const lineScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      ref={ref}
      className="py-28 bg-[#060a14] relative overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Ambient glow top-center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]
        bg-indigo-600/8 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative">

        {/* Header */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full
            border border-indigo-500/20 bg-indigo-500/8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[11.5px] font-bold text-indigo-400 uppercase tracking-[0.12em]">
              How it works
            </span>
          </div>
          <h2 className="text-[38px] md:text-[52px] font-black text-white leading-[1.05]
            tracking-[-0.032em] max-w-lg">
            From code to production
            <br />
            <span className="text-gray-500">in four steps.</span>
          </h2>
        </motion.div>

        {/* Desktop: connected flow */}
        <div className="hidden md:block relative">

          {/* Connector line — animated on scroll */}
          <div className="absolute top-[26px] left-[calc(12.5%+26px)] right-[calc(12.5%+26px)] h-px
            bg-white/[0.05] overflow-hidden">
            <motion.div
              className="h-full origin-left"
              style={{
                scaleX: lineScaleX,
                background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #3b82f6 100%)',
              }}
            />
          </div>

          <div className="grid grid-cols-4 gap-6">
            {steps.map((step, i) => {
              const c = colorMap[step.color];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Icon node sits on the connector line */}
                  <div className="flex justify-center mb-7">
                    <motion.div
                      className={`w-[52px] h-[52px] rounded-2xl border flex items-center
                        justify-center relative z-10 ${c.ring}`}
                      whileHover={{ scale: 1.08, y: -2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <step.icon size={22} className={c.icon} />
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="text-center px-1">
                    <div className="text-[10.5px] font-black tracking-[0.12em] mb-2
                      text-white/20">
                      {step.number}
                    </div>
                    <h3 className="text-[15px] font-black text-white tracking-tight mb-2.5 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-[12.5px] text-gray-500 leading-[1.65] mb-4">
                      {step.desc}
                    </p>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-[5px]
                      rounded-full border text-[11px] font-semibold ${c.badge}`}>
                      <span className={`w-1 h-1 rounded-full ${c.dot}`} />
                      {step.metric}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="md:hidden">
          <div className="relative pl-10">
            {/* Vertical track */}
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/[0.05]" />

            <div className="space-y-8">
              {steps.map((step, i) => {
                const c = colorMap[step.color];
                return (
                  <motion.div
                    key={i}
                    className="relative"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {/* Dot on track */}
                    <div className={`absolute -left-10 top-0.5 w-[38px] h-[38px] rounded-xl
                      border flex items-center justify-center ${c.ring}`}>
                      <step.icon size={16} className={c.icon} />
                    </div>

                    <div className="text-[10.5px] font-black tracking-[0.12em] text-white/20 mb-1">
                      {step.number}
                    </div>
                    <h3 className="text-[15px] font-black text-white tracking-tight mb-1.5">
                      {step.title}
                    </h3>
                    <p className="text-[12.5px] text-gray-500 leading-relaxed mb-3">
                      {step.desc}
                    </p>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-[5px]
                      rounded-full border text-[11px] font-semibold ${c.badge}`}>
                      <span className={`w-1 h-1 rounded-full ${c.dot}`} />
                      {step.metric}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;