import "../styles/MarqueeStats.css";

export default function MarqueeStats({ stats }) {

  if (!stats?.length)
    return (
      <div className="marquee-wrapper">
        <div className="marquee">Loading dashboard stats…</div>
      </div>
    );

  return (
    <div className="marquee-wrapper">
      <div className="marquee">
        {stats.map((item, i) => (
          <div key={i} className="marquee-item">
            <span className="label">{item.label}: </span>
            <span className="value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
