import { games } from ".."

export function handleJoin(url: URL) {
    const gameId = url.searchParams.get("gameId")
    if (!gameId) {
        const newGameId = generateGameId()
        games.set(newGameId, null)
        return new Response(newGameId, { status: 200 })
    }
    if (!games.has(gameId)) {
        return new Response("Game not found", { status: 404 })
    }
    return new Response(gameId, { status: 200 })
}

export function generateGameId() {
    return Math.random().toString(36).substring(2, 10)
}