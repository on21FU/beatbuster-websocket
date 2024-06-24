import { server } from "../..";

export default function handleReady({ userId, gameId }: { userId: string, gameId: string }) {
    server.publish(gameId, JSON.stringify({
        type: "ready",
        body: {
            userId
        }
    }))
}