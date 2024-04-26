import SpotifyWebApi from "spotify-web-api-node";
import { z } from "zod";


const games = new Map<string, GameState | null>()

type GameState = {
    configuration: any,
    state: {
        players: Player[],
        round: number
    },
}

type Player = UserInfo & {
    score: number
}

type UserInfo = z.infer<typeof userSchema>

const userSchema = z.object({
    username: z.string(),
    imageUrl: z.string(),
    userId: z.string()
})

const joinMessageSchema = z.object({
    gameId: z.string(),
    user: userSchema
})


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
            console.log("Received message: " + msg.toString())
            server.send("you said:" + msg.toString())
        },
        close(server) {
            handleClose(server.data)
        }
    }, port: 8080
})

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
                round: 0
            }
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