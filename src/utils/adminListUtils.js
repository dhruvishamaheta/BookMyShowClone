export function getDurationValue(value) {
  const text = String(value || "")
    .trim()
    .toLowerCase();

  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

export function getReleaseValue(value) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime();
}

export function sortAdminItems(items, sortBy) {
  const sorted = [...items];

  switch (sortBy) {
    case "rating":
      return sorted.sort((a, b) => {
        const left = Number(b.rating ?? 0);
        const right = Number(a.rating ?? 0);
        return left - right || String(a.title || "").localeCompare(String(b.title || ""));
      });
    case "releaseDate":
      return sorted.sort((a, b) => {
        const left = getReleaseValue(b.releaseDate || b.date || b.time || "");
        const right = getReleaseValue(a.releaseDate || a.date || a.time || "");
        return left - right || String(a.title || "").localeCompare(String(b.title || ""));
      });
    case "duration":
      return sorted.sort((a, b) => {
        const left = getDurationValue(b.duration || b.time || "");
        const right = getDurationValue(a.duration || a.time || "");
        return left - right || String(a.title || "").localeCompare(String(b.title || ""));
      });
    case "alphabetical":
    default:
      return sorted.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
  }
}

export function paginateItems(items, page, pageSize) {
  const safePageSize = Number(pageSize) || 5;
  const safePage = Math.max(1, Number(page) || 1);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const nextPage = Math.min(safePage, totalPages);
  const startIndex = (nextPage - 1) * safePageSize;
  const endIndex = startIndex + safePageSize;

  return {
    items: items.slice(startIndex, endIndex),
    page: nextPage,
    totalPages,
    totalItems,
    startIndex: totalItems === 0 ? 0 : startIndex + 1,
    endIndex: Math.min(endIndex, totalItems),
  };
}
