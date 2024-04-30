import { z } from "zod"

export type GameState = {
    configuration: Configuration,
    state: {
        players: Player[],
        round: number
    },
}

export type Player = UserInfo & {
    score: number
}

export type UserInfo = z.infer<typeof userSchema>

export type Configuration = {
    playlist: Playlist,
    roundTime: number,
    winCondition: {
        type: "rounds",
        amount: number,
    } | {
        type: "score",
        amount: number
    }     
}

const configurationSchema = z.object({
    
})

type Playlist = {
    id: string,
    imgUrl: string | undefined,
    name: string
}

export const userSchema = z.object({
    username: z.string(),
    imageUrl: z.string(),
    userId: z.string()
})

export const joinMessageSchema = z.object({
    gameId: z.string(),
    user: userSchema
})

const messageSchema = z.object({
    type: z.union([z.literal("start-game"), z.literal("")]),
})