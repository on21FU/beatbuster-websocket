import type { Server, ServerWebSocket } from "bun";
import { games, type WebSocketServerData } from "../..";
import type { Answer } from "../../types";

export function handleAnswer({ gameId, answer, server }: { gameId: string, answer: Answer, server: Server }) {
    const game = games.get(gameId)
    if (!game || !game.configuration) return
    const roundTime = game.configuration.roundTime
    const score = calculateScore({
        timeToAnswer: answer.timeToAnswer / 1000,
        correct: answer.trackId === game.state.correctTrackId,
        roundTime
    })
    games.set(gameId, {
        ...game,
        state: {
            ...game.state,
            players: game.state.players.map(player => {
                if (player.userId === answer.userId) {
                    return {
                        ...player,
                        score: player.score + score
                    }
                }
                return player
            }),
            answers: [...game.state.answers, { ...answer, gainedScore: score }]
        }
    })
    const updatedGame = games.get(gameId)
    if (!updatedGame) return
    if (updatedGame.state.answers.length === updatedGame.state.players.length) {
        const resultsForClient = {
            type: "round-results",
            body: {
                correctTrackId: updatedGame.state.correctTrackId,
                answers: updatedGame.state.answers,
                players: updatedGame.state.players
            }
        }
        server.publish(gameId, JSON.stringify(resultsForClient))
        console.log("Sending results", resultsForClient)

    }

}

function calculateScore({ timeToAnswer, correct, roundTime }: { timeToAnswer: number, correct: boolean, roundTime: number }) {
    if (!correct) return 0
    if (timeToAnswer > roundTime) return 0
    if (timeToAnswer === 0) return 1000
    console.log(timeToAnswer, roundTime)
    return Math.ceil((roundTime - timeToAnswer) * 100)
}