import { z } from "zod";
import { joinMessageSchema, type GameState, type UserInfo } from "./types";
import { handleJoin } from "./handler/join";
import { handleOpen } from "./handler/open";
import { handleMessage } from "./handler/message";
import { handleClose } from "./handler/close";


export const games = new Map<string, GameState | null>()

function parseJoinOptions(options: any): options is z.infer<typeof joinMessageSchema> {
    return joinMessageSchema.safeParse(options).success
}

export type WebSocketServerData = { gameId: string, user: UserInfo }

export const server = Bun.serve<WebSocketServerData>({
    fetch(req, server) {
        const url = new URL(req.url)

        if (url.pathname === "/join") return handleJoin(url)

        const optionsString = url.searchParams.get("options")
        const options = optionsString ? JSON.parse(optionsString) : {}

        if (!parseJoinOptions(options)) {
            console.log("Failed to parse")
            return new Response("Invalid options", { status: 400 })
        }
        const { gameId, user } = options

        const success = server.upgrade(req, {
            data: {
                gameId,
                user
            }
        })

        if (success) {
            return
        }
        return new Response("Could not upgrade connection")
    },
    websocket: {
        open(client) {
            handleOpen(client)
        },
        async message(client, msg) {
            await handleMessage({ msg: msg.toString(), client });
        },
        close(client) {
            handleClose(client)
        }

    }, port: 8080
})

console.log("Server running on port " + server.port)