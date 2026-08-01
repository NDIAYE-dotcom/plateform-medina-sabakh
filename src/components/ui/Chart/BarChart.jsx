import "./Chart.css";

/**
 * data: [{ label, value }]
 * Graphique en barres léger, en SVG pur — sans dépendance externe.
 */
export default function BarChart({ data = [], height = 200, color = "var(--color-primary)" }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="chart" style={{ height }}>
      <div className="chart__bars">
        {data.map((item) => (
          <div className="chart__bar-col" key={item.label}>
            <div className="chart__bar-track">
              <div
                className="chart__bar"
                style={{ height: `${(item.value / max) * 100}%`, backgroundColor: color }}
                title={`${item.label} : ${item.value}`}
              />
            </div>
            <span className="chart__bar-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
