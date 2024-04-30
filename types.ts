import { z } from "zod"

export type GameState = {
    configuration: Configuration | null,
    state: {
        players: Player[],
        round: number
    },
}

export type Player = UserInfo & {
    score: number
}

export type UserInfo = z.infer<typeof userSchema>

export type Configuration = z.infer<typeof configurationSchema>

const configurationSchema = z.object({
    playlist: z.object({
        id: z.string(),
        imgUrl: z.string().optional(),
        name: z.string()
    }),
    roundTime: z.number(),
    winCondition: z.union([
        z.object({
            type: z.literal("rounds"),
            amount: z.number()
        }),
        z.object({
            type: z.literal("score"),
            amount: z.number()
        })
    ]),
})

export const userSchema = z.object({
    username: z.string(),
    imageUrl: z.string(),
    userId: z.string()
})

export const joinMessageSchema = z.object({
    gameId: z.string(),
    user: userSchema
})


const messageSchema = z.union([
    z.object({
        type: z.literal("join"),
        body: joinMessageSchema
    }),
    z.object({
        type: z.literal("start-game"),
        body: configurationSchema
    })
])
