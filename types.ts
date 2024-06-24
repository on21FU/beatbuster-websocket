import { z } from "zod"

export type GameState = {
    configuration: Configuration | null,
    state: State
    trackIds: string[]
}

export type State = {
    players: Player[],
    round: number,
    answers: Answer[],
    correctTrackId: string | null
}

export type Answer = {
    userId: string
    trackId: string
    timeToAnswer: number,
    gainedScore?: number
}

export type RoundData = State & {
    tracks: {
        correctTrackId: string
        wrongTrackIds: string[]
    }
}

export type Player = UserInfo & {
    score: number
}

export type UserInfo = z.infer<typeof userSchema>

export type Configuration = z.infer<typeof configurationSchema>

export type ConfigurationWithoutAccessToken = z.infer<typeof configurationSchemaWithoutAccessToken>

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
    accessToken: z.string()
})

const configurationSchemaWithoutAccessToken = configurationSchema.omit({ accessToken: true })

export const userSchema = z.object({
    username: z.string(),
    imageUrl: z.string(),
    userId: z.string()
})

export const joinMessageSchema = z.object({
    gameId: z.string(),
    user: userSchema
})

export const answerMessageSchema = z.object({
    userId: z.string(),
    trackId: z.string(),
    timeToAnswer: z.number()
})



export const messageSchema = z.union([
    z.object({
        type: z.literal("join-game")
    }),
    z.object({
        type: z.literal("start-game"),
        body: configurationSchema
    }),
    z.object({
        type: z.literal("answer"),
        body: answerMessageSchema
    }),
    z.object({
        type: z.literal("update-config"),
        body: configurationSchemaWithoutAccessToken
    }),
    z.object({
        type: z.literal("restart-game")
    }),
    z.object({
        type: z.literal("ready")
    })
])
