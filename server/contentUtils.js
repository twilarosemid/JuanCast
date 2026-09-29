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

module.exports = {
  getPollDisplayTitle,
  sortRankings
};
