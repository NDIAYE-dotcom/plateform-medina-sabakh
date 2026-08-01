import "./Table.css";

/**
 * columns: [{ key, header, render?(row), align? }]
 * rows: array of objects, must include a stable `id`
 */
export default function Table({
  columns = [],
  rows = [],
  emptyMessage = "Aucune donnée à afficher",
  onRowClick,
  className = "",
}) {
  return (
    <div className="table-wrap">
      <table className={`table ${className}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ textAlign: col.align ?? "left" }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table__empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className={onRowClick ? "table__row--clickable" : ""}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} style={{ textAlign: col.align ?? "left" }}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
