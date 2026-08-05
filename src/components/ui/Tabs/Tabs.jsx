import "./Tabs.css";

/**
 * tabs: [{ id, label, badge? }]
 */
export default function Tabs({ tabs, activeId, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activeId}
          className={`tabs__tab ${tab.id === activeId ? "tabs__tab--active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.badge != null && <span className="tabs__badge">{tab.badge}</span>}
        </button>
      ))}
    </div>
  );
}
