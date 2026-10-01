import { useEffect, useRef, useState } from 'react';

const CustomCursor = () => {
  const dotRef = useRef(null);
  const circleRef = useRef(null);
  const [isHoveringText, setIsHoveringText] = useState(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);

  useEffect(() => {
    const dot = dotRef.current;
    const circle = circleRef.current;
    if (!dot || !circle) return;

    let mouseX = 0;
    let mouseY = 0;
    let circleX = 0;
    let circleY = 0;

    // Track mouse position
    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Dot follows instantly
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    };

    // Smooth follow for the circle
    const animate = () => {
      circleX += (mouseX - circleX) * 0.15;
      circleY += (mouseY - circleY) * 0.15;
      circle.style.transform = `translate(${circleX}px, ${circleY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animate);
    };
    animate();

    // Detect hover state
    const handleMouseOver = (e) => {
      const target = e.target;

      // Text elements (headings + paragraphs)
      const textTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN'];
      const isText =
        textTags.includes(target.tagName) &&
        !target.closest('a') &&
        !target.closest('button') &&
        target.textContent?.trim().length > 0;

      // Interactive elements
      const isInteractive =
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.hasAttribute('data-cursor-hover');

      setIsHoveringText(isText);
      setIsHoveringInteractive(isInteractive);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  // Dynamic size based on state
  const getCircleSize = () => {
    if (isHoveringText) return 120;      // Big circle on text hover
    if (isHoveringInteractive) return 56; // Medium on buttons/links
    return 32;                            // Default
  };

  return (
    <>
      {/* The growing circle */}
      <div
        ref={circleRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] hidden lg:block
          rounded-full mix-blend-difference"
        style={{
          width: `${getCircleSize()}px`,
          height: `${getCircleSize()}px`,
          backgroundColor: '#4F46E5',   // Yellow (Tailwind yellow-400)
          opacity: isHoveringText ? 0.85 : isHoveringInteractive ? 0.6 : 0.4,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
          willChange: 'transform, width, height',
        }}
      />

      {/* The precise dot */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[10000] hidden lg:block
          rounded-full bg-indigo-600"
        style={{
          width: '6px',
          height: '6px',
          opacity: isHoveringText ? 0 : 1,
          transition: 'opacity 0.2s ease',
          willChange: 'transform',
        }}
      />
    </>
  );
};

export default CustomCursor;