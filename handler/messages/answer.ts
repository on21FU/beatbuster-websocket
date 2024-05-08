import { games } from "../..";
import type { Answer } from "../../types";

export function handleAnswer({ gameId, answer }: { gameId: string, answer: Answer }) {
    const game = games.get(gameId)
    if (!game || !game.configuration) return
    const roundTime = game.configuration.roundTime
    console.log(answer.trackId, game.trackIds[game.state.round + 1])
    const score = calculateScore({
        timeToAnswer: answer.timeToAnswer,
        correct: answer.trackId === game.trackIds[game.state.round + 1],
        roundTime
    })
    console.log("score", score)

}

function calculateScore({ timeToAnswer, correct, roundTime }: { timeToAnswer: number, correct: boolean, roundTime: number }) {
    if (!correct) return 0
    console.log("Wir rechnen eig")
    return (roundTime - timeToAnswer / 1000) / roundTime * 1000
}