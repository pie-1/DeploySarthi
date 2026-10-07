import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// ⚠️ Replace this with your demo video URL
const VIDEO_URL = 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID';

const Hero = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Very smooth spring — feels like slow camera pan
  const springConfig = { stiffness: 40, damping: 20, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Second-stage smoothing for even softer feel
  const x = useSpring(smoothX, { stiffness: 20, damping: 25 });
  const y = useSpring(smoothY, { stiffness: 20, damping: 25 });

  const layers = [
    {
      src: '/images/vercel.png',
      alt: 'Vercel deployment',
      xRange: [-18, 18],
      yRange: [-14, 14],
      rotateRange: [-2, 2],
      className: 'top-[12%] left-[5%] w-48 md:w-56',
      depth: 0.8,
      delay: 0.2,
    },
    {
      src: '/images/github.webp',
      alt: 'GitHub repository',
      xRange: [15, -15],
      yRange: [12, -12],
      rotateRange: [2, -2],
      className: 'top-[18%] right-[6%] w-44 md:w-52',
      depth: 1.0,
      delay: 0.3,
    },
    {
      src: '/images/aws.png',
      alt: 'AWS App Runner',
      xRange: [-12, 12],
      yRange: [14, -14],
      rotateRange: [-1.5, 1.5],
      className: 'bottom-[15%] left-[8%] w-44 md:w-52',
      depth: 0.6,
      delay: 0.4,
    },
    {
      src: '/images/dashboard.png',
      alt: 'DeploySarthi dashboard',
      xRange: [14, -14],
      yRange: [-12, 12],
      rotateRange: [1.5, -1.5],
      className: 'bottom-[12%] right-[5%] w-52 md:w-64',
      depth: 1.2,
      delay: 0.5,
    },
  ];

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    mouseX.set((clientX / window.innerWidth) * 2 - 1);
    mouseY.set((clientY / window.innerHeight) * 2 - 1);
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-20 bg-[#fafafa]"
      onMouseMove={handleMouseMove}
    >
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-200/30
        rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-200/30
        rounded-full blur-[100px] pointer-events-none" />

      {/* Floating parallax images */}
      {layers.map((layer, i) => {
        const layerX = useTransform(x, [-1, 1], layer.xRange);
        const layerY = useTransform(y, [-1, 1], layer.yRange);
        const layerRotate = useTransform(x, [-1, 1], layer.rotateRange);

        return (
          <motion.div
            key={i}
            style={{ x: layerX, y: layerY, rotate: layerRotate }}
            className={`absolute ${layer.className} pointer-events-none hidden md:block`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: layer.delay, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Inner float animation — separate from parallax */}
            <motion.img
              src={layer.src}
              alt={layer.alt}
              className="w-full h-auto rounded-xl shadow-2xl shadow-black/10 border border-gray-200/50"
              animate={{
                y: [0, -8, 0],
                transition: {
                  duration: 5 + i * 0.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
            />
          </motion.div>
        );
      })}

      <div className="relative max-w-3xl mx-auto px-6 text-center z-10">
        <motion.h1
          className="text-[42px] md:text-[68px] font-black text-gray-900 leading-[1.05] tracking-[-0.03em] mb-6"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          Ship with confidence.
          <br />
          <span className="text-indigo-600">We handle the rest.</span>
        </motion.h1>

        <motion.p
          className="text-[16px] md:text-[18px] text-gray-600 leading-relaxed mb-10 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          Connect your GitHub repo. We check if it's ready, deploy it,
          monitor it 24/7, explain what went wrong, and suggest prompts to fix it too.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            onClick={handleGetStarted}
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2
              px-7 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold text-[15px]
              hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]
              shadow-lg shadow-indigo-500/25"
          >
            Get Started Free
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <a
            href={VIDEO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2
              px-7 py-3.5 border border-gray-300 text-gray-800 rounded-xl font-semibold
              text-[15px] hover:bg-gray-50 hover:border-gray-400 transition-all
              hover:scale-[1.02] active:scale-[0.98] bg-white"
          >
            <Play size={15} className="fill-gray-800" />
            View Demo
          </a>
        </motion.div>

        <motion.p
          className="mt-8 text-[12.5px] text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          Open source · Free forever · No credit card required
        </motion.p>
      </div>
    </section>
  );
};

export default Hero;