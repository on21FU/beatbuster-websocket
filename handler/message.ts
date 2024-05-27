import type { Server, ServerWebSocket } from "bun";
import { messageSchema } from "../types";
import { handleStartGame, startNextRound } from "./messages/start-game";
import type { WebSocketServerData } from "..";
import { sendPlayersToClient } from "./messages/join-game";
import type { z } from "zod";
import { handleAnswer } from "./messages/answer";
import { handleConfigUpdate } from "./messages/config-update";

export async function handleMessage({ msg, client, server }: { msg: string, client: ServerWebSocket<WebSocketServerData>, server: Server }) {

    const { gameId } = client.data

    try {
        const data = JSON.parse(msg);
        if (!validateMessageSchema(data)) {
            console.log("Invalid message")
            messageSchema.parse(data)
            return
        }

        switch (data.type) {
            case "start-game":
                await handleStartGame({ gameId, configuration: data.body });
                await startNextRound({ gameId });
                break;
            case "join-game":
                sendPlayersToClient({ client })
                break;
            case "answer":
                handleAnswer({ gameId, answer: data.body, server })
                break;
            case "update-config":
                handleConfigUpdate({ config: data.body, gameId });
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
