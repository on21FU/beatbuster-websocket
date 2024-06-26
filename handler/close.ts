import type { ServerWebSocket } from "bun"
import { type WebSocketServerData, games, server } from ".."

export function handleClose(client: ServerWebSocket<WebSocketServerData>) {
    const { gameId, user } = client.data
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
    const updatedGame = games.get(gameId)

    if (!updatedGame) return

    server.publish(gameId, JSON.stringify({
        type: "update-players",
        body: updatedGame.state.players
    }))


}
