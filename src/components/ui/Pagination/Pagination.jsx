import { ChevronLeftIcon, ChevronRightIcon } from "../icons";
import "./Pagination.css";

function getPageList(current, total) {
  const pages = [];
  const neighborRange = 1;

  for (let page = 1; page <= total; page += 1) {
    const isEdge = page === 1 || page === total;
    const isNearCurrent = Math.abs(page - current) <= neighborRange;
    if (isEdge || isNearCurrent) {
      pages.push(page);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return pages;
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = getPageList(currentPage, totalPages);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="pagination__nav"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Page précédente"
      >
        <ChevronLeftIcon />
      </button>

      <ul className="pagination__list">
        {pages.map((page, index) =>
          page === "..." ? (
            <li key={`ellipsis-${index}`} className="pagination__ellipsis">
              …
            </li>
          ) : (
            <li key={page}>
              <button
                type="button"
                className={`pagination__page ${page === currentPage ? "pagination__page--active" : ""}`}
                onClick={() => onPageChange(page)}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            </li>
          )
        )}
      </ul>

      <button
        type="button"
        className="pagination__nav"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Page suivante"
      >
        <ChevronRightIcon />
      </button>
    </nav>
  );
}
