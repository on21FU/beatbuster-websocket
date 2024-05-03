import SpotifyWebApi from "spotify-web-api-node";

export async function getTrackIdsFromPlaylist({ spotify, playlistId }: { spotify: SpotifyWebApi, playlistId: string }) {
    const playlist = await spotify.getPlaylist(playlistId);
    const trackIds = [];
    for (let i = 0; i < Math.ceil(playlist.body.tracks.total / 100); i++) {
        const trackResponse = await spotify.getPlaylistTracks(playlistId, {
            limit: 100,
            offset: i * 100
        });
        trackIds.push(...getTrackIds(trackResponse.body));
    }
    return trackIds;
}

function getTrackIds(trackResponse: SpotifyApi.PlaylistTrackResponse) {
    return trackResponse.items
        .filter(item => item.track && item.track.id)
        .map(item => item.track?.id) as string[]
}

export function initializeSpotify(accessToken: string) {
    return new SpotifyWebApi({
        accessToken,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET
    })
}
