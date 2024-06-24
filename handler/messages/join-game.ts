import type { ServerWebSocket } from "bun"
import { games, server, type WebSocketServerData } from "../.."

export function sendPlayersToClient({ client }: { client: ServerWebSocket<WebSocketServerData> }) {
    const { gameId } = client.data
    const game = games.get(gameId)
    if (!game) {
        console.log("No game found")
        return
    }

    server.publish(gameId, JSON.stringify({
        type: "update-players",
        body: {
            players: game.state.players
        }
    }))

}
