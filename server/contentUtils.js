function getPollDisplayTitle(title, eventDate) {
  const parsedDate = new Date(eventDate);
  const hasEnded = !Number.isNaN(parsedDate.getTime()) && parsedDate < new Date();
  return hasEnded ? `${title} (Ended)` : title;
}

function sortRankings(rankings = []) {
  return [...rankings].sort((a, b) => {
    const aPosition = Number(a.position ?? a.rank ?? Number.MAX_SAFE_INTEGER);
    const bPosition = Number(b.position ?? b.rank ?? Number.MAX_SAFE_INTEGER);

    if (aPosition !== bPosition) {
      return aPosition - bPosition;
    }

    return Number(b.voteCount ?? 0) - Number(a.voteCount ?? 0);
  });
}

function normalizeImageUrl(value = '') {
  if (!value) return '';

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
      return isLocalhost
        ? `https://juancast.onrender.com${url.pathname}${url.search}${url.hash}`
        : value;
    } catch {
      return value;
    }
  }

  if (/^[a-z][a-z\d+.-]*:/i.test(value)) return value;

  const cleanPath = value.startsWith('/') ? value : `/${value}`;
  const formattedPath = cleanPath.startsWith('/uploads/')
    ? cleanPath
    : `/uploads/${cleanPath.replace(/^\//, '')}`;
  return `https://juancast.onrender.com${formattedPath}`;
}

module.exports = {
  getPollDisplayTitle,
  sortRankings,
  normalizeImageUrl
};
