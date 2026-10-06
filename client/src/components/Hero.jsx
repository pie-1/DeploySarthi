import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const Hero = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 25, damping: 30, mass: 1.2 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const layers = [
    {
      src: '/images/vercel.png',
      alt: 'Vercel deployment',
      x: useTransform(x, [-1, 1], [-18, 18]),
      y: useTransform(y, [-1, 1], [-14, 14]),
      rotate: useTransform(x, [-1, 1], [-2, 2]),
      className: 'top-[12%] left-[5%] w-48 md:w-56',
      delay: 0.2,
    },
    {
      src: '/images/github.webp',
      alt: 'GitHub repository',
      x: useTransform(x, [-1, 1], [15, -15]),
      y: useTransform(y, [-1, 1], [12, -12]),
      rotate: useTransform(x, [-1, 1], [2, -2]),
      className: 'top-[18%] right-[6%] w-44 md:w-52',
      delay: 0.3,
    },
    {
      src: '/images/aws.png',
      alt: 'AWS App Runner',
      x: useTransform(x, [-1, 1], [-12, 12]),
      y: useTransform(y, [-1, 1], [14, -14]),
      rotate: useTransform(x, [-1, 1], [-1.5, 1.5]),
      className: 'bottom-[15%] left-[8%] w-44 md:w-52',
      delay: 0.4,
    },
    {
      src: '/images/dashboard.png',
      alt: 'DeploySarthi dashboard',
      x: useTransform(x, [-1, 1], [14, -14]),
      y: useTransform(y, [-1, 1], [-12, 12]),
      rotate: useTransform(x, [-1, 1], [1.5, -1.5]),
      className: 'bottom-[12%] right-[5%] w-52 md:w-64',
      delay: 0.5,
    },
  ];

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    mouseX.set((clientX / window.innerWidth) * 2 - 1);
    mouseY.set((clientY / window.innerHeight) * 2 - 1);
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-20"
      onMouseMove={handleMouseMove}
    >
      {layers.map((layer, i) => (
        <motion.div
          key={i}
          style={{ x: layer.x, y: layer.y, rotate: layer.rotate }}
          className={`absolute ${layer.className} pointer-events-none hidden md:block`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: layer.delay }}
        >
          <img
            src={layer.src}
            alt={layer.alt}
            className="w-full h-auto rounded-xl shadow-2xl shadow-black/10 border border-gray-200/50"
          />
        </motion.div>
      ))}

      <div className="relative max-w-3xl mx-auto px-6 text-center z-10">
        <motion.h1
          className="text-[42px] md:text-[68px] font-black text-gray-900 leading-[1.05] tracking-[-0.03em] mb-6"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          Ship with confidence.
          <br />
          <span className="text-indigo-600">We handle the rest.</span>
        </motion.h1>

        <motion.p
          className="text-[17px] md:text-[19px] text-gray-600 leading-relaxed mb-10 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Connect your GitHub repo. We check if it's ready, deploy it,
          monitor it 24/7,explain what went wrong and suggest prompts to fix it too.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <button
            className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 text-white rounded-xl
              font-semibold text-[15px] hover:bg-indigo-700 transition-all
              hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/20"
          >
            Get Started Free
          </button>
          <button
            className="w-full sm:w-auto px-7 py-3.5 border border-gray-300 text-gray-800
              rounded-xl font-semibold text-[15px] hover:bg-gray-50 transition-all
              hover:scale-[1.02] active:scale-[0.98]"
          >
            View Demo
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;