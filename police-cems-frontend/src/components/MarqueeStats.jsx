export default function MarqueeStats({ stats }) {

  // HARD loading guard (only blocks on undefined / null)
  if (!Array.isArray(stats)) {
    return (
      <div className="w-full py-3 bg-slate-900/50 text-white text-sm text-center italic border-b border-slate-700">
        Initializing secure data stream...
      </div>
    );
  }

  // Duplicate stats so animation never ends
  const loopStats = [...stats, ...stats];

  return (
    <div className="relative w-full overflow-hidden bg-slate-900/80 border-b border-slate-700/50 backdrop-blur-md">

      {/* Animation */}
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee-scroll 25s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Track */}
      <div className="flex w-max marquee-track py-3">

        {loopStats.map((item, i) => (
          <div
            key={i}
            className="flex items-center mx-8 whitespace-nowrap"
          >
            <span className="text-xs font-bold text-white uppercase tracking-wide mr-2">
              {item.label}
            </span>

            <span className="font-mono font-bold text-blue-400 text-lg">
              {item.value ?? 0}
            </span>

            <span className="ml-5 text-slate-700">•</span>
          </div>
        ))}

      </div>

      {/* Fade edges */}
      <div className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-slate-900 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none" />

    </div>
  );
}
