/* This is the Socket.IO server. Used by the API to get data from the shards. Each shard connects to it */

import { Server } from 'socket.io';
import { createServer } from 'http';
import { getShardOf } from './utils/discord';

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: '*' // You might want to restrict this in production
    }
});

httpServer.listen(process.env.IPC_PORT);

// Store connected sockets by shard ID
const connectedShards = new Map();

io.on('connection', (socket) => {
    const { shardID } = socket.handshake.query;
    connectedShards.set(shardID, socket);
    console.log(`Shard ${shardID} connected`);

    socket.on('disconnect', () => {
        // Remove the disconnected shard
        for (const [shardId, s] of connectedShards.entries()) {
            if (s === socket) {
                connectedShards.delete(shardId);
                console.log(`Shard ${shardId} disconnected`);
                break;
            }
        }
    });
});

const getSockets = () => Array.from(connectedShards.entries());

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
    const statuses: ShardStatus[] = [];
    const sockets = getSockets();

    const results = await Promise.all(
        sockets.map(([, socket]) =>
            new Promise<ShardStatus>((resolve) => {
                socket.once('getShardStatusResponse', (status: ShardStatus) => resolve(status));
                socket.emit('getShardStatus');
            })
        )
    );

    // Fill in results for all possible shards
    for (let i = 0; i < (process.env.SHARD_COUNT as unknown as number); i++) {
        const status = results.find(s => s.id === i);
        if (status) {
            statuses.push(status);
        } else {
            statuses.push({
                id: i,
                status: 'Disconnected',
                ram: 0,
                ping: 0,
                serverCount: 0
            });
        }
    }
    return statuses;
};

export const getChannelsOf = async (guildID: string): Promise<ChannelData[]> => {
    const results = await Promise.all(
        getSockets()
            .map(([, socket]) =>
                new Promise<ChannelData[]>((resolve) => {
                    socket.once('getChannelsOfResponse', (channels: ChannelData[]) => {
                        resolve(channels);
                    });
                    socket.emit('getChannelsOf', { guildID, shardID: getShardOf(guildID) });
                })
            )
    );
    return results.flat() as ChannelData[];
};

export const verifyGuilds = async (guildIDs: string[]): Promise<string[]> => {
    const results = await Promise.all(
        getSockets()
            .map(([, socket]) =>
                new Promise<string[]>((resolve) => {
                    socket.once('verifyGuildsResponse', (verifiedGuilds: string[]) => {
                        resolve(verifiedGuilds);
                    });
                    socket.emit('verifyGuilds', { guildIDs });
                })
            )
    );
    return results.flat() as string[];
};

export const verifyPermissions = async (userID: string, permissionName: bigint, guildIDs: string[]): Promise<string[]> => {
    const results = await Promise.all(
        getSockets()
            .map(([, socket]) =>
                new Promise<string[]>((resolve) => {
                    socket.once('verifyPermissionsResponse', (verifiedGuilds: string[]) => {
                        resolve(verifiedGuilds);
                    });
                    socket.emit('verifyPermissions', { userID, permissionName: permissionName.toString(), guildIDs });
                })
            )
    );
    return results.flat() as string[];
};

export const fetchUsers = async (userIDs: string[]): Promise<UserData[]> => {
    const shardID = parseInt(getSockets()[0][0].slice('ManageInvite Shard #'.length) || '0');
    const results = await Promise.all(
        getSockets()
            .map(([, socket]) =>
                new Promise<UserData[]>((resolve) => {
                    socket.once('fetchUsersResponse', (users: UserData[]) => {
                        resolve(users);
                    });
                    socket.emit('fetchUsers', { userIDs, shardID });
                })
            )
    );
    console.log(results);
    return (results.flat() as UserData[]).filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
};

type NotificationType = 'verification' | 'subscribed' | 'paid' | 'dms' | 'cancelled';

export const sendPaypalNotification = (guildID: string, guildName: string, userID: string, notificationType: NotificationType): void => {
    getSockets()
        .map(([, socket]) =>
            socket.emit('paypalNotification', {
                notificationType,
                guildID,
                guildName,
                userID,
                shardID: getShardOf(process.env.SUPPORT_SERVER_ID!)
            })
        );
};
