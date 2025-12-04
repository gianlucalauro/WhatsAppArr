function buildRadarrMessage(eventType, movie, movieFile, t) {
  const movieTitle = movie?.title || t('messages.radarr.unknown_movie');
  const movieYear = movie?.year ? ` (${movie.year})` : '';
  const quality = movieFile?.quality || t('messages.radarr.unknown_quality');
  const link = movie?.tmdbId ? `https://www.themoviedb.org/movie/${movie.tmdbId}` : t('messages.radarr.unknown_link');

  switch (eventType) {
    case 'Download':
      return `🎬 ${t('messages.radarr.download_title')}\n\n` +
        `🎞️ ${t('messages.radarr.title')}: ${movieTitle}${movieYear}\n` +
        `📺 ${t('messages.radarr.quality')}: ${quality}\n\n` +
        `${link}\n\n` +
        `${t('messages.radarr.enjoy')}`;

    case 'MovieDelete':
      return `🗑️ ${t('messages.radarr.deleted_title')}\n\n` +
        `🎞️ ${t('messages.radarr.title')}: ${movieTitle}${movieYear}\n` +
        `📺 ${t('messages.radarr.quality')}: ${quality}\n\n` +
        `${link}`;

    default:
      return `ℹ️ ${t('messages.radarr.event_received', { event: eventType })}\n\n` +
        `🎞️ ${t('messages.radarr.title')}: ${movieTitle}${movieYear}\n` +
        `📺 ${t('messages.radarr.quality')}: ${quality}\n\n` +
        `${link}`;
  }
}

module.exports = { buildRadarrMessage };
