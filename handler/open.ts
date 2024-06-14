import type { ServerWebSocket } from "bun"
import { games, type WebSocketServerData } from ".."

export function handleOpen(server: ServerWebSocket<WebSocketServerData>) {
    console.log("opening...")
    const { gameId, user } = server.data
    server.subscribe(gameId)
    const game = games.get(gameId)
    if (!game) {
        throw new Error("Game not found") // throw Error to redirect the user to 404
    }
    game.state.players.push({
        ...user,
        score: 0
    })

    console.log(gameId, game.state.players)
}