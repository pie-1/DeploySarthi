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
  },
  {
    icon: ShieldCheck,
    number: '02',
    title: 'Run readiness check',
    desc: 'We scan for missing env vars, security risks, and potential AWS cost issues.',
    metric: '12 checks run',
  },
  {
    icon: Activity,
    number: '03',
    title: 'Deploy and monitor',
    desc: 'One approval deploys to Vercel or AWS. Monitoring starts automatically.',
    metric: '24/7 monitoring',
  },
  {
    icon: Brain,
    number: '04',
    title: 'Understand what broke',
    desc: 'AI correlates events across services and explains the root cause in plain English.',
    metric: '< 60s to explain',
  },
];

const HowItWorks = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.3'],
  });

  const lineWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section
      ref={ref}
      className="py-28 bg-[#060a14]"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.15em] mb-3">
            How it works
          </p>
          <h2
            className="text-[36px] md:text-[52px] font-black text-white leading-[1.05]
              tracking-[-0.03em] max-w-lg"
          >
            From code to production in four steps.
          </h2>
        </motion.div>

        <div className="hidden md:block relative">
          <div className="absolute top-[52px] left-[12.5%] right-[12.5%] h-px bg-white/[0.06]">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500/60 via-indigo-400/60 to-violet-500/60"
              style={{ width: lineWidth }}
            />
          </div>

          <div className="grid grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="relative"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
              >
                <div className="flex justify-center mb-8">
                  <div
                    className="w-[52px] h-[52px] rounded-2xl border border-white/[0.1] bg-[#0d1117]
                      flex items-center justify-center relative z-10
                      shadow-xl shadow-black/30"
                  >
                    <step.icon size={22} className="text-indigo-400" />
                  </div>
                </div>

                <div className="text-center px-2">
                  <div className="text-[11px] font-black text-indigo-500/60 tracking-[0.1em] mb-2">
                    {step.number}
                  </div>
                  <h3 className="text-[15px] font-black text-white tracking-tight mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[12.5px] text-gray-500 leading-relaxed mb-4">
                    {step.desc}
                  </p>
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                      bg-indigo-500/8 border border-indigo-500/15"
                  >
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

        <div className="md:hidden relative pl-8">
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
                <div
                  className="absolute -left-8 top-0 w-6 h-6 rounded-lg border border-indigo-500/30
                    bg-[#0d1117] flex items-center justify-center"
                >
                  <step.icon size={12} className="text-indigo-400" />
                </div>

                <div className="text-[11px] font-black text-indigo-500/50 tracking-[0.1em] mb-1">
                  {step.number}
                </div>
                <h3 className="text-[15px] font-black text-white tracking-tight mb-1.5">
                  {step.title}
                </h3>
                <p className="text-[12.5px] text-gray-500 leading-relaxed mb-3">
                  {step.desc}
                </p>
                <span className="text-[11px] font-semibold text-indigo-400">
                  {step.metric}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;