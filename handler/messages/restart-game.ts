import { games, server } from "../..";
import type { GameState } from "../../types";

export function handleRestartGame({ gameId }: { gameId: string }) {
    const game = games.get(gameId);
    if (!game) return

    const newGame: GameState = {
        ...game,
        state: {
            ...game.state,
            round: 0,
            correctTrackId: "",
            players: game.state.players.map(player => ({
                ...player,
                score: 0
            })),
        }
    }

    games.set(gameId, newGame)
    server.publish(gameId, JSON.stringify({
        type: "restart-game"
    }))
}