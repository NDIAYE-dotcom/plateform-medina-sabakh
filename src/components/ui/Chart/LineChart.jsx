import "./Chart.css";

/**
 * data: [{ label, value }]
 * Graphique en ligne léger, en SVG pur — sans dépendance externe.
 */
export default function LineChart({ data = [], height = 200, color = "var(--color-primary)" }) {
  const width = 100;
  const svgHeight = 100;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;

  const points = data.map((item, index) => {
    const x = data.length > 1 ? (index / (data.length - 1)) * width : width / 2;
    const y = svgHeight - ((item.value - min) / range) * svgHeight;
    return { x, y, ...item };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${width},${svgHeight} L0,${svgHeight} Z`;

  return (
    <div className="chart" style={{ height }}>
      <svg
        className="chart__svg"
        viewBox={`0 0 ${width} ${svgHeight}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Graphique en ligne"
      >
        <path d={areaPath} fill={color} opacity="0.12" stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r="1.6" fill={color}>
            <title>{`${p.label} : ${p.value}`}</title>
          </circle>
        ))}
      </svg>
      <div className="chart__labels">
        {data.map((item) => (
          <span key={item.label} className="chart__labels-item">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
