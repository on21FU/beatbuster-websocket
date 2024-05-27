import { server, } from "../..";
import type { ConfigurationWithoutAccessToken } from "../../types";

export function handleConfigUpdate({ config, gameId }: { config: ConfigurationWithoutAccessToken, gameId: string }) {
    server.publish(gameId, JSON.stringify({
        type: "update-config",
        body: config
    }))
}