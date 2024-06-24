import { games, server } from "../..";

export default function handleReady({ userId, gameId }: { userId: string, gameId: string }) {
    const game = games.get(gameId)
    if (!game) return
    games.set(gameId, {
        ...game,
        state: {
            ...game?.state,
            players: game.state.players.map(player => {
                if (player.userId === userId) {
                    return {
                        ...player,
                        isReady: true
                    }
                }
                return player
            })
        }
    })

    const updatedGame = games.get(gameId)
    if (!updatedGame) return

    console.log("Updating Players", updatedGame.state.players)

    server.publish(gameId, JSON.stringify({
        type: "update-players",
        body: {
            players: updatedGame.state.players
        }
    }))
}