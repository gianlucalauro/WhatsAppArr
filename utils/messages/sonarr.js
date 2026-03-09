function buildSonarrMessage(eventType, series, episodes, episodeFile, release, t) {
    const seriesTitle = series?.title || t('messages.sonarr.unknown_series');
    const season = episodes?.[0]?.seasonNumber !== undefined ? `S${String(episodes[0].seasonNumber).padStart(2, '0')}` : '';
    const episode = episodes?.[0]?.episodeNumber !== undefined ? `E${String(episodes[0].episodeNumber).padStart(2, '0')}` : '';
    const episodeTitle = episodes?.[0]?.title || '';
    const quality = episodeFile?.quality || release?.quality || t('messages.unknown_quality');
    const link = series?.tvdbId ? `https://www.thetvdb.com/?id=${series.tvdbId}&tab=series` : null;
    const seriesLine = `📺 ${t('messages.sonarr.series')}: ${seriesTitle}`;
    const episodeLine = season && episode ? `🎞️ ${t('messages.sonarr.episode')}: ${season}${episode}${episodeTitle ? ` - ${episodeTitle}` : ''}` : '';
    const qualityLine = `📺 ${t('messages.quality')}: ${quality}`;

    switch (eventType) {
        case 'Test':
            return `✅ ${t('messages.sonarr.test_title')}`;

        case 'Grab':
            return `📥 ${t('messages.sonarr.grab_title')}\n\n` +
                `${seriesLine}\n` +
                `${episodeLine}\n` +
                `📺 ${t('messages.quality')}: ${release?.quality || t('messages.unknown_quality')}\n` +
                `📡 ${t('messages.indexer')}: ${release?.indexer || '?'}\n\n` +
                (link ? `${link}` : '');

        case 'Download':
            return `🎬 ${t('messages.sonarr.download_title')}\n\n` +
                `${seriesLine}\n` +
                `${episodeLine}\n` +
                `${qualityLine}\n\n` +
                (link ? `${link}\n\n` : '') +
                `${t('messages.enjoy')}`;

        case 'Rename':
            return `✏️ ${t('messages.sonarr.rename_title')}\n\n` +
                `${seriesLine}\n\n` +
                (link ? `${link}` : '');

        case 'SeriesAdd':
            return `➕ ${t('messages.sonarr.added_title')}\n\n` +
                `${seriesLine}\n\n` +
                (link ? `${link}` : '');

        case 'SeriesDelete':
            return `🗑️ ${t('messages.sonarr.deleted_title')}\n\n` +
                `${seriesLine}\n\n` +
                (link ? `${link}` : '');

        case 'EpisodeFileDelete':
            return `🗑️ ${t('messages.sonarr.file_deleted_title')}\n\n` +
                `${seriesLine}\n` +
                `${episodeLine}\n` +
                `${qualityLine}\n\n` +
                (link ? `${link}` : '');

        case 'Health':
            return `⚠️ ${t('messages.health_title')}\n\n` +
                `🔴 ${t('messages.health_level')}: ${series?.level || '?'}\n` +
                `💬 ${t('messages.health_message')}: ${series?.message || '?'}`;

        case 'HealthRestored':
            return `💚 ${t('messages.health_restored_title')}\n\n` +
                `💬 ${t('messages.health_message')}: ${series?.message || '?'}`;

        case 'ApplicationUpdate':
            return `🔄 ${t('messages.update_title')}\n\n` +
                `📦 ${t('messages.update_new')}: ${series?.newVersion || '?'}\n` +
                `📦 ${t('messages.update_old')}: ${series?.previousVersion || '?'}`;

        case 'ManualInteractionRequired':
            return `🖐️ ${t('messages.manual_interaction_title')}\n\n` +
                `${seriesLine}\n` +
                `${episodeLine}\n` +
                `${qualityLine}\n\n` +
                (link ? `${link}` : '');

        default:
            return `ℹ️ ${t('messages.event_received', {event: eventType})}\n\n` +
                `${seriesLine}\n` +
                `${episodeLine}\n` +
                `${qualityLine}\n\n` +
                (link ? `${link}` : '');
    }
}

module.exports = {buildSonarrMessage};
