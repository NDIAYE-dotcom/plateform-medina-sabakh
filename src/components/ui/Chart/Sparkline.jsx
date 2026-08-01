/**
 * values: [number] — mini graphique de tendance, sans axes ni labels.
 */
export default function Sparkline({ values = [], width = 96, height = 32, color = "var(--color-primary)" }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = values.map((value, index) => {
    const x = values.length > 1 ? (index / (values.length - 1)) * width : width / 2;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="presentation">
      <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
