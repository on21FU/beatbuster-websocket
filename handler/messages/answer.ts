import type { Server, ServerWebSocket } from "bun";
import { games, type WebSocketServerData } from "../..";
import type { Answer, GameState, Player } from "../../types";
import { startNextRound } from "./start-game";

export function handleAnswer({ gameId, answer, server }: { gameId: string, answer: Answer, server: Server }) {
    const game = games.get(gameId)
    if (!game || !game.configuration) return
    const roundTime = game.configuration.roundTime
    const gainedScore = calculateScore({
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
                        score: player.score + gainedScore
                    }
                }
                return player
            }),
            answers: [
                ...game.state.answers,
                {
                    ...answer,
                    gainedScore,
                    timeToAnswer: answer.timeToAnswer / 1000
                }
            ]
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
                players: updatedGame.state.players.sort((a, b) => b.score - a.score)
            }
        }
        server.publish(gameId, JSON.stringify(resultsForClient))
        console.log("Sending results", resultsForClient)

        setTimeout(() => {
            if (isWinConditionFulfilled({ game: updatedGame })) {
                server.publish(gameId, JSON.stringify({
                    type: "game-results",
                    body: {
                        players: updatedGame.state.players
                    }
                }))
                return
            }

            games.set(gameId, {
                ...updatedGame,
                state: {
                    ...updatedGame.state,
                    answers: [],
                }
            })

            startNextRound({ gameId })
        }, 5000)

    }

}

function isWinConditionFulfilled({ game }: { game: GameState }) {
    if (game.configuration?.winCondition.type === "score") {
        const winConditionPerPlayer = game.state.players.map(player => {
            console.log(player.score >= game.configuration!.winCondition.amount)
            return player.score >= game.configuration!.winCondition.amount
        })
        return winConditionPerPlayer.includes(true)
    }

    if (game.configuration?.winCondition.type === "rounds") {
        return game.state.round >= game.configuration!.winCondition.amount
    }
}

export function calculateScore({ timeToAnswer, correct, roundTime }: { timeToAnswer: number, correct: boolean, roundTime: number }) {
    if (!correct) return 0
    if (timeToAnswer > roundTime) return 0
    if (timeToAnswer < 1) return 1000
    const score = 10 * (100 * Math.E ** (-timeToAnswer / 10))
    console.log(score, timeToAnswer, roundTime)
    if (score > 1000) return 1000
    return Math.round(score)
}