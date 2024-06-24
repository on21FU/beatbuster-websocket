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
                    score: 0,
                    isReady: false
                }],
                round: 1,
                correctTrackId: null,
                answers: []
            },
            trackIds: []
        })
        return
    }
    game.state.players.push({
        ...user,
        score: 0,
        isReady: false
    })

    console.log(gameId, game.state.players)
}