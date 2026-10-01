const Logo = ({ size = 32, showText = true }) => {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        {/* Rounded square background */}
        <rect width="64" height="64" rx="16" fill="#4F46E5" />
        
        {/* Rocket body */}
        <path
          d="M32 10 C32 10, 24 20, 24 34 L24 42 L40 42 L40 34 C40 20, 32 10, 32 10 Z"
          fill="white"
        />
        
        {/* Rocket window */}
        <circle cx="32" cy="28" r="4" fill="#4F46E5" />
        
        {/* Left fin */}
        <path
          d="M24 36 L18 44 L24 42 Z"
          fill="white"
        />
        
        {/* Right fin */}
        <path
          d="M40 36 L46 44 L40 42 Z"
          fill="white"
        />
        
        {/* Exhaust flames */}
        <rect x="29" y="44" width="2" height="8" rx="1" fill="white" opacity="0.9" />
        <rect x="32" y="44" width="2" height="10" rx="1" fill="white" />
        <rect x="35" y="44" width="2" height="8" rx="1" fill="white" opacity="0.9" />
      </svg>
      
      {showText && (
        <span className="font-semibold text-gray-900">DeploySarthi</span>
      )}
    </div>
  );
};

export default Logo;