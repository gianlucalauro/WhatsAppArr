const {buildRadarrMessage} = require("./radarr");
const {buildSonarrMessage} = require("./sonarr");
const i18next = require("i18next");

function buildMessage(req) {
    const t = req.t || i18next.t.bind(i18next);
    const body = req.body;
    const {instanceName, eventType} = body;

    if (eventType === "Test") {
        return `✅ ${t('messages.test_title', {instance: instanceName})}\n\n` +
            `${t('messages.test_body')}`;
    }

    switch (instanceName) {
        case 'Radarr': {
            const {movie, movieFile, release} = body;
            return buildRadarrMessage(eventType, movie, movieFile, release, t);
        }
        case 'Sonarr': {
            const {series, episodes, episodeFile, release} = body;
            return buildSonarrMessage(eventType, series, episodes, episodeFile, release, t);
        }
        default: {
            return `ℹ️ ${t('messages.event_received', {event: eventType})}`;
        }
    }
}

module.exports = {buildMessage};
