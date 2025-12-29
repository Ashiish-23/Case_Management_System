import "./MarqueeStats.css";

export default function MarqueeStats({ stats }) {

  // 🔹 Handle loading state BEFORE JSX
  if (!stats || stats.length === 0) {
    return (
      <div className="marquee-wrapper">
        <div className="marquee">Loading stats…</div>
      </div>
    );
  }

  return (
    <div className="marquee-wrapper">
      <div className="marquee">
        {stats.map((item, index) => (
          <div key={index} className="marquee-item">
            <span className="label">{item.label}:</span>
            <span className="value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
