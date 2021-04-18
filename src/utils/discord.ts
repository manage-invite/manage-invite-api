export const getShardOf = (guildID: string): number => (guildID as unknown as number >> 22) % (process.env.SHARD_COUNT as unknown as number);
