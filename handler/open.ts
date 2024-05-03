import type { ServerWebSocket } from "bun"
import { games, type WebSocketServerData } from ".."

export function handleOpen(server: ServerWebSocket<WebSocketServerData>) {
    console.log("opening...")
    const { gameId, user } = server.data
    server.subscribe(gameId)
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

    console.log(gameId, game.state.players)
}