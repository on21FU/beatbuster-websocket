import type { ServerWebSocket } from "bun";
import { games, server, type WebSocketServerData } from "../..";
import { shuffleArray } from "../../helpers";
import { getTrackIdsFromPlaylist, initializeSpotify } from "../../spotify";
import type { Configuration, RoundData } from "../../types";

export async function handleStartGame({ gameId, configuration }: { gameId: string, configuration: Configuration }) {
    const unconfiguredGame = games.get(gameId);
    if (!unconfiguredGame) {
        console.log("No game found");
        return
    }

    games.set(gameId, { ...unconfiguredGame, configuration })
    const game = games.get(gameId)

    if (!game || !game.configuration) {
        console.log("No configuration found")
        return
    }

    const spotify = initializeSpotify(game.configuration.accessToken)
    const playlistId = game.configuration.playlist.id
    const trackIds = await getTrackIdsFromPlaylist({ spotify, playlistId })

    games.set(gameId, {
        ...game,
        trackIds: shuffleArray(trackIds),
        state: {
            ...game.state,
            round: 0,
        }
    })
}

export async function startNextRound({ gameId }: { gameId: string }) {
    const game = games.get(gameId);
    if (!game || !game.configuration) return

    const correctTrackId = game.trackIds[game.state.round]
    const wrongTrackIds = getWrongTrackIds({ allTracks: game.trackIds, correctTrackId })

    const roundData: RoundData = {
        ...game.state,
        tracks: {
            correctTrackId,
            wrongTrackIds
        },
        correctTrackId,
        round: game.state.round + 1
    }

    server.publish(gameId, JSON.stringify({
        type: "start-round",
        body: roundData
    }))

    games.set(gameId, {
        ...game,
        state: {
            ...game.state,
            round: game.state.round + 1,
            correctTrackId
        }
    })
}

function getWrongTrackIds({ allTracks, correctTrackId }: { allTracks: string[], correctTrackId: string }) {
    const availableTracks = allTracks.filter((currentTrackId) => currentTrackId !== correctTrackId)
    return shuffleArray(availableTracks).splice(0, 3)
}