import type { ServerWebSocket } from "bun";
import { messageSchema } from "../types";
import { handleStartGame, startNextRound } from "./messages/start-game";
import type { WebSocketServerData } from "..";
import { sendPlayersToClient } from "./messages/join-game";
import type { z } from "zod";

export async function handleMessage({ msg, client }: { msg: string, client: ServerWebSocket<WebSocketServerData> }) {

    const { gameId, user } = client.data

    try {
        const data = JSON.parse(msg);
        if (!validateMessageSchema(data)) {
            console.log("Invalid message")
            return
        }

        switch (data.type) {
            case "start-game":
                await handleStartGame({ gameId, configuration: data.body });
                await startNextRound({ gameId, client });
                break;
            case "join-game":
                console.log("join-game")
                sendPlayersToClient({ client })
                break;
            default:
                break;
        }

    } catch (error) {
        console.log("Error: ", error);
    }
}

function validateMessageSchema(data: unknown): data is z.infer<typeof messageSchema> {
    return messageSchema.safeParse(data).success;
}
