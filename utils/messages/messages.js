const {buildRadarrMessage} = require("./radarr");
const i18next = require("i18next");
const {buildSonarrMessage} = require("./sonarr");

function buildMessage(req) {
    const t = req.t || i18next.t.bind(i18next);
    const body = req.body;
    const { instanceName, eventType } = body;
    if (eventType === "Test") {
        return `✅ ${t('messages.test_title', { instance: instanceName })}\n\n` +
            `${t('messages.test_body')}`;
    }

    switch (instanceName) {
        case 'Radarr':
            const { movie, movieFile } = body;
            return buildRadarrMessage(eventType, movie, movieFile, t)
        case 'Sonarr':
            const { series, episodes, episodeFile, release } = body;
            return buildSonarrMessage(eventType, series, episodes, episodeFile, release, t)
    }
}

module.exports = { buildMessage };
