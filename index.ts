import SpotifyWebApi from "spotify-web-api-node";
import { z } from "zod";
import { joinMessageSchema, messageSchema, type Configuration, type GameState, type UserInfo } from "./types";


const games = new Map<string, GameState | null>()

function parseJoinOptions(options: any): options is z.infer<typeof joinMessageSchema> {
    return joinMessageSchema.safeParse(options).success
}

const server = Bun.serve<{ gameId: string, user: UserInfo }>({
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
        message(server, msg) {
            handleMessage({ msg: msg.toString(), gameId: server.data.gameId, user: server.data.user });
            //console.log("Received message: " + msg.toString())
            // server.send("you said:" + msg.toString())
        },
        close(server) {
            handleClose(server.data)
        }
    }, port: 8080
})

function handleMessage({ user, gameId, msg }: { user: UserInfo, gameId: string, msg: string }) {
    try {
        const data = JSON.parse(msg);
        if (!validateMessageSchema(data)) {
            console.log("Invalid message")
            return
        }

        switch (data.type) {
            case "start-game":
                handleStartGame({ gameId, configuration: data.body });
                break;

            default:
                break;
        }

    } catch (error) {
        console.log("Error: ", error);
    }
}

function handleStartGame({ gameId, configuration }: { gameId: string, configuration: Configuration }) {
    const game = games.get(gameId);
    if(!game) {
        console.log("No game found");
        return
    }
    games.set(gameId, {...game, configuration})
    startNextRound();
    console.log(games.get(gameId))
}

function startNextRound(){

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
    console.log(games.get(gameId))
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