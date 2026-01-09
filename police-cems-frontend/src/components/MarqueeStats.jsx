// import "../styles/MarqueeStats.css"; // Deleted

export default function MarqueeStats({ stats }) {

  // Loading State
  if (!stats?.length)
    return (
      <div className="w-full py-3 bg-slate-900/50 text-slate-500 text-sm text-center italic border-b border-slate-700">
        Initializing secure data stream...
      </div>
    );

  return (
    <div className="relative w-full overflow-hidden bg-slate-900/80 border-b border-slate-700/50 backdrop-blur-md">
      
      {/* Inline Style for the custom animation 
        (This creates the scrolling effect)
      */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: scroll 20s linear infinite;
        }
        /* Pause on hover so officers can read the numbers */
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* The Scrolling Container */}
      <div className="flex whitespace-nowrap py-3 animate-marquee">
        
        {stats.map((item, i) => (
          <div key={i} className="inline-flex items-center mx-8 group cursor-default">
            
            {/* Label (Uppercase, muted) */}
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-2 group-hover:text-slate-300 transition-colors">
              {item.label}:
            </span>
            
            {/* Value (Monospace, glowing color) */}
            <span className="font-mono text-sm font-bold text-blue-400 group-hover:text-blue-300 group-hover:drop-shadow-[0_0_5px_rgba(59,130,246,0.5)] transition-all">
              {item.value}
            </span>

            {/* Separator Dot */}
            <span className="ml-8 text-slate-700">•</span>
            
          </div>
        ))}

      </div>

      {/* Left Fade Gradient (Visual Polish) */}
      <div className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-slate-900 to-transparent pointer-events-none"></div>
      
      {/* Right Fade Gradient (Visual Polish) */}
      <div className="absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none"></div>

    </div>
  );
}