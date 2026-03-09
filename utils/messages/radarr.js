function buildRadarrMessage(eventType, movie, movieFile, release, t) {
  const movieTitle = movie?.title || t('messages.radarr.unknown_movie');
  const movieYear = movie?.year ? ` (${movie.year})` : '';
  const quality = movieFile?.quality || release?.quality || t('messages.radarr.unknown_quality');
  const link = movie?.tmdbId ? `https://www.themoviedb.org/movie/${movie.tmdbId}` : null;
  const movieLine = `🎞️ ${t('messages.radarr.title')}: ${movieTitle}${movieYear}`;
  const qualityLine = `📺 ${t('messages.radarr.quality')}: ${quality}`;

  switch (eventType) {
    case 'Test':
      return `✅ ${t('messages.radarr.test_title')}`;

    case 'Grab':
      return `📥 ${t('messages.radarr.grab_title')}\n\n` +
        `${movieLine}\n` +
        `📺 ${t('messages.radarr.quality')}: ${release?.quality || t('messages.radarr.unknown_quality')}\n` +
        `📡 ${t('messages.radarr.indexer')}: ${release?.indexer || '?'}\n\n` +
        (link ? `${link}` : '');

    case 'Download':
      return `🎬 ${t('messages.radarr.download_title')}\n\n` +
        `${movieLine}\n` +
        `${qualityLine}\n\n` +
        (link ? `${link}\n\n` : '') +
        `${t('messages.radarr.enjoy')}`;

    case 'Rename':
      return `✏️ ${t('messages.radarr.rename_title')}\n\n` +
        `${movieLine}\n\n` +
        (link ? `${link}` : '');

    case 'MovieDelete':
      return `🗑️ ${t('messages.radarr.deleted_title')}\n\n` +
        `${movieLine}\n` +
        `${qualityLine}\n\n` +
        (link ? `${link}` : '');

    case 'MovieFileDelete':
      return `🗑️ ${t('messages.radarr.file_deleted_title')}\n\n` +
        `${movieLine}\n` +
        `${qualityLine}\n\n` +
        (link ? `${link}` : '');

    case 'Health':
      return `⚠️ ${t('messages.radarr.health_title')}\n\n` +
        `🔴 ${t('messages.radarr.health_level')}: ${movie?.level || '?'}\n` +
        `💬 ${t('messages.radarr.health_message')}: ${movie?.message || '?'}`;

    case 'HealthRestored':
      return `💚 ${t('messages.radarr.health_restored_title')}\n\n` +
        `💬 ${t('messages.radarr.health_message')}: ${movie?.message || '?'}`;

    case 'ApplicationUpdate':
      return `🔄 ${t('messages.radarr.update_title')}\n\n` +
        `📦 ${t('messages.radarr.update_new')}: ${movie?.newVersion || '?'}\n` +
        `📦 ${t('messages.radarr.update_old')}: ${movie?.previousVersion || '?'}`;

    case 'MovieAdded':
      return `➕ ${t('messages.radarr.added_title')}\n\n` +
        `${movieLine}\n\n` +
        (link ? `${link}` : '');

    case 'ManualInteractionRequired':
      return `🖐️ ${t('messages.radarr.manual_interaction_title')}\n\n` +
        `${movieLine}\n` +
        `${qualityLine}\n\n` +
        (link ? `${link}` : '');

    default:
      return `ℹ️ ${t('messages.radarr.event_received', { event: eventType })}\n\n` +
        `${movieLine}\n` +
        `${qualityLine}\n\n` +
        (link ? `${link}` : '');
  }
}

module.exports = { buildRadarrMessage };
