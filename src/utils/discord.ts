export const getShardOf = (guildID: string): number => Number(BigInt(guildID as unknown as number) >> 22n) % (process.env.SHARD_COUNT as unknown as number);
