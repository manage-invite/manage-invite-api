/* This is the "veza" server. Used by the API to get data from the shards. Each shard connects to it */

import { NetworkError, NodeMessage, Server, ServerSocket } from 'veza';
import { getShardOf } from './utils/discord';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const server = new Server(process.env.IPC_SERVER_NAME!);

const getSockets = () => Array.from(server.sockets).filter(c => /\d+$/.test(c[0]));

interface ChannelData {
    id: string;
    name: string;
}

interface ShardStatus {
    id: number;
    status: string;
    ram: number;
    ping: number;
    serverCount: number;
}

interface UserData {
    id: string;
    username: string;
    discriminator: string;
    avatarURL: string;
}

export const getShardsStatus = async (): Promise<ShardStatus[]> => {
    const results = await Promise.all(
        getSockets()
            .map(s => s[1].send({
                event: 'getShardStatus'
            }, { receptive: true }))
    ) as ShardStatus[];
    const statuses = [];
    for (let i = 0; i < (process.env.SHARD_COUNT as unknown as number); i++) {
        statuses.push(
            results.find((r) => r.id === i) || {
                id: i,
                status: 'Disconnected',
                ram: 0,
                ping: 0,
                serverCount: 0
            }
        )
    }
    return statuses;
};

export const getChannelsOf = async (guildID: string): Promise<ChannelData[]> => {
    const results = await Promise.all(
        getSockets()
            .map(s => s[1].send({
                event: 'getChannelsOf',
                guildID,
                shardID: getShardOf(guildID)
            }, { receptive: true }))
    );
    return results.flat() as ChannelData[];
}

export const verifyGuilds = async (guildIDs: string[]): Promise<string[]> => {
    const results = await Promise.all(
        getSockets()
            .map(s => s[1].send({
                event: 'verifyGuilds',
                guildIDs
            }, { receptive: true }))
    );
    return results.flat() as string[];
};

export const verifyPermissions = async (userID: string, permissionName: string, guildIDs: string[]): Promise<string[]> => {
    const results = await Promise.all(
        getSockets()
            .map(s => s[1].send({
                event: 'verifyPermissions',
                userID,
                permissionName,
                guildIDs
            }, { receptive: true }))
    );
    return results.flat() as string[];
};

export const fetchUsers = async (userIDs: string[], guildID?: string): Promise<UserData[]> => {
    const results = await Promise.all(
        getSockets()
            .map(s => s[1].send({
                event: 'fetchUsers',
                userIDs,
                shardID: guildID ? getShardOf(guildID) : null
            }, { receptive: true }))
    )
    console.log(results)
    // https://stackoverflow.com/a/56757215/11856499
    return (results.flat() as UserData[]).filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)
};

server.on('connect', (client: ServerSocket) => {
    // Disconnect clients that do not match our specified client name.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (!client.name?.startsWith(process.env.IPC_CLIENT_NAME!)) {
        client.disconnect(true);
    }

    console.log(`[IPC] Client connected: ${client.name}`);
});

server.on('disconnect', (client: ServerSocket) => {
    console.log(`[IPC] Client disconnected: ${client.name}`);
});

server.on('error', (error: Error | NetworkError, client: ServerSocket | null) => {
    console.error(`[IPC] Client error: ${client?.name ?? 'unknown'}`, error);
});

server.on('message', async (message: NodeMessage) => {
    const { event, data } = message.data;

    if (event === 'collectData') {
        const results = await Promise.all(
            getSockets()
                .map(s => s[1].send({
                    event: 'collectData',
                    data
                }, { receptive: true }))
        );

        message.reply((results as unknown as string[]).reduce((a, b) => a + b));
    }

    if (event === 'sendTo') {
        const reply = await server.sendTo(message.data.to, data, { receptive: true });

        message.reply(reply);
    }
});

server.listen(process.env.IPC_SERVER_PORT ?? 4000).catch(console.error);
