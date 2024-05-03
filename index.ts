import SpotifyWebApi from "spotify-web-api-node";
import { z } from "zod";
import { joinMessageSchema, messageSchema, type Configuration, type GameState, type RoundData, type UserInfo } from "./types";
import type { ServerWebSocket } from "bun";
import { getTrackIdsFromPlaylist } from "./spotify";
import { shuffleArray } from "./helpers";


const games = new Map<string, GameState | null>()

function parseJoinOptions(options: any): options is z.infer<typeof joinMessageSchema> {
    return joinMessageSchema.safeParse(options).success
}

type WebSocketServerData = { gameId: string, user: UserInfo }

const server = Bun.serve<WebSocketServerData>({
    fetch(req, server) {
        const url = new URL(req.url)

        if (url.pathname === "/join") return handleJoin(url)

        const optionsString = url.searchParams.get("options")
        const options = optionsString ? JSON.parse(optionsString) : {}

        if (!parseJoinOptions(options)) {
            console.log("Failed to parse")
            return new Response("Invalid options", { status: 400 })
        }
        const { gameId, user } = options

        const success = server.upgrade(req, {
            data: {
                gameId,
                user
            }
        })

        if (success) {
            return
        }
        return new Response("Could not upgrade connection")
    },
    websocket: {
        open(server) {
            handleOpen(server.data)
        },
        async message(server, msg) {
            await handleMessage({ msg: msg.toString(), server });
        },
        close(server) {
            handleClose(server.data)
        }

    }, port: 8080
})

async function handleMessage({ msg, server }: { msg: string, server: ServerWebSocket<WebSocketServerData> }) {

    const { gameId, user } = server.data

    try {
        const data = JSON.parse(msg);
        if (!validateMessageSchema(data)) {
            console.log("Invalid message")
            return
        }

        switch (data.type) {
            case "start-game":
                await handleStartGame({ gameId, configuration: data.body });
                await startNextRound({ gameId, server });
                break;

            default:
                break;
        }

    } catch (error) {
        console.log("Error: ", error);
    }
}
async function startNextRound({ gameId, server }: { gameId: string, server: ServerWebSocket<WebSocketServerData> }) {
    const game = games.get(gameId);
    if (!game || !game.configuration) return

    const roundData: RoundData = {
        ...game.state,
        trackId: game.trackIds[game.state.round - 1]
    }

    server.send(JSON.stringify(roundData))

    games.set(gameId,
        {
            ...game,
            state: { ...game.state, round: game.state.round + 1 }
        })
}

async function handleStartGame({ gameId, configuration }: { gameId: string, configuration: Configuration }) {
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

    console.log("gameId in handlEstartGame", gameId)

    games.set(gameId, {
        ...game,
        trackIds: shuffleArray(trackIds)
    })
}


function validateMessageSchema(data: unknown): data is z.infer<typeof messageSchema> {
    return messageSchema.safeParse(data).success;
}

function handleClose({ gameId, user }: { gameId: string, user: UserInfo }) {
    console.log("leaving...")
    const game = games.get(gameId)
    if (!game) return
    games.set(gameId, {
        ...game,
        state: {
            ...game.state,
            players: game.state.players.filter(p => p.userId !== user.userId)
        },
    })
}

function handleOpen({ gameId, user }: { gameId: string, user: UserInfo }) {
    console.log("opening...")
    const game = games.get(gameId)
    if (!game) {
        games.set(gameId, {
            configuration: null,
            state: {
                players: [{
                    ...user,
                    score: 0
                }],
                round: 1
            },
            trackIds: []
        })
        return
    }
    game.state.players.push({
        ...user,
        score: 0
    })
}

function initializeSpotify(accessToken: string) {
    return new SpotifyWebApi({
        accessToken,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET
    })
}

export function generateGameId() {
    return Math.random().toString(36).substring(2, 10)
}

function handleJoin(url: URL) {
    const gameId = url.searchParams.get("gameId")
    if (!gameId) {
        const newGameId = generateGameId()
        games.set(newGameId, null)
        return new Response(newGameId, { status: 200 })
    }
    if (!games.has(gameId)) {
        return new Response("Game not found", { status: 404 })
    }
    return new Response(gameId, { status: 200 })
}

console.log("Server running on port " + server.port)