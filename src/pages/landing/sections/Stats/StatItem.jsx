import { useCountUp } from "../../../../hooks/useCountUp";
import { useInView } from "../../../../hooks/useInView";

export default function StatItem({ icon: Icon, target, suffix = "", label }) {
  const [ref, isInView] = useInView({ threshold: 0.4 });
  const value = useCountUp(target, { start: isInView });

  return (
    <div className="stats__item" ref={ref}>
      <div className="stats__icon">
        <Icon />
      </div>
      <p className="stats__value">
        {value.toLocaleString("fr-FR")}
        {suffix}
      </p>
      <p className="stats__label">{label}</p>
    </div>
  );
}
