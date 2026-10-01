import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 50, damping: 20 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  // Different parallax speeds for each image
  const img1X = useTransform(x, [-1, 1], [-30, 30]);
  const img1Y = useTransform(y, [-1, 1], [-20, 20]);
  const img2X = useTransform(x, [-1, 1], [25, -25]);
  const img2Y = useTransform(y, [-1, 1], [15, -15]);
  const img3X = useTransform(x, [-1, 1], [-15, 15]);
  const img3Y = useTransform(y, [-1, 1], [-10, 10]);
  const img4X = useTransform(x, [-1, 1], [20, -20]);
  const img4Y = useTransform(y, [-1, 1], [10, -10]);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    // Normalize to -1 to 1
    mouseX.set((clientX / innerWidth) * 2 - 1);
    mouseY.set((clientY / innerHeight) * 2 - 1);
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16"
      onMouseMove={handleMouseMove}
    >
      {/* Floating Background Images */}
      <motion.div
        style={{ x: img1X, y: img1Y }}
        className="absolute top-[15%] left-[8%] w-32 h-32 md:w-40 md:h-40 
          bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-2xl 
          shadow-lg border border-indigo-100/50 pointer-events-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="w-full h-full flex items-center justify-center text-4xl">🚀</div>
      </motion.div>

      <motion.div
        style={{ x: img2X, y: img2Y }}
        className="absolute top-[20%] right-[10%] w-28 h-28 md:w-36 md:h-36 
          bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl 
          shadow-lg border border-purple-100/50 pointer-events-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <div className="w-full h-full flex items-center justify-center text-4xl">📊</div>
      </motion.div>

      <motion.div
        style={{ x: img3X, y: img3Y }}
        className="absolute bottom-[20%] left-[12%] w-24 h-24 md:w-32 md:h-32 
          bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl 
          shadow-lg border border-blue-100/50 pointer-events-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <div className="w-full h-full flex items-center justify-center text-3xl">🔍</div>
      </motion.div>

      <motion.div
        style={{ x: img4X, y: img4Y }}
        className="absolute bottom-[15%] right-[8%] w-32 h-32 md:w-40 md:h-40 
          bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl 
          shadow-lg border border-emerald-100/50 pointer-events-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <div className="w-full h-full flex items-center justify-center text-4xl">🤖</div>
      </motion.div>

      {/* Content */}
      <div className="relative max-w-3xl mx-auto px-6 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 
            rounded-full text-xs font-medium text-indigo-700 mb-6"
        >
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
          AI-Assisted Deployment
        </motion.div>

        <motion.h1
          className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Ship with confidence.
          <br />
          <motion.span
            className="text-indigo-600 inline-block cursor-default"
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          >
            We handle the rest.
          </motion.span>
        </motion.h1>

        <motion.p
          className="text-lg text-gray-600 mb-10 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          DeploySarthi connects your GitHub repo, checks if your app is ready,
          deploys it, monitors it 24/7, and explains what went wrong in plain English.
        </motion.p>

        <motion.div
          className="flex items-center justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.button
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium 
              hover:bg-indigo-700 transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Get Started Free
            <ArrowRight size={18} />
          </motion.button>
          <motion.button
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium 
              hover:bg-gray-50 transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            View Demo
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;