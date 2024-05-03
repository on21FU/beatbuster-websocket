import type { ServerWebSocket } from "bun"
import { type WebSocketServerData, games, server } from ".."

export function handleClose(client: ServerWebSocket<WebSocketServerData>) {
    const { gameId, user } = client.data
    console.log("leaving...")
    const game = games.get(gameId)
    if (!game) return

    if (game.state.players.length === 1) {
        games.delete(gameId)
        return
    }

    games.set(gameId, {
        ...game,
        state: {
            ...game.state,
            players: game.state.players.filter(p => p.userId !== user.userId)
        },
    })


    server.publish(gameId, JSON.stringify({
        type: "update-players",
        body: game.state.players
    }))


}
