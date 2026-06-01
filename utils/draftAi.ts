export type RawAdpPlayer = {
    playerID?: string | number;
    longName?: string;
    teamAbv?: string;
    posADP?: string;
    overallADP?: string | number;
};

export type AiPlayer = {
    id: string;
    name: string;
    team?: string;
    position: string;
    position_rank?: number;
    overall_adp?: number;
    pos_adp?: string;
};

export const normalizePosition = (posADP?: string) => {
    const safePosADP = posADP ?? "";
    const positionMatch = safePosADP.match(/[A-Za-z]+/);
    const rankMatch = safePosADP.match(/\d+/);

    return {
        position: positionMatch ? positionMatch[0].toUpperCase() : "",
        positionRank: rankMatch ? Number(rankMatch[0]) : undefined,
    };
};

export const toAiPlayer = (player: RawAdpPlayer): AiPlayer => {
    const { position, positionRank } = normalizePosition(player.posADP);
    const overallAdp = Number(player.overallADP);

    return {
        id: String(player.playerID ?? player.longName ?? ""),
        name: player.longName ?? "",
        team: player.teamAbv,
        position,
        position_rank: positionRank,
        overall_adp: Number.isFinite(overallAdp) ? overallAdp : undefined,
        pos_adp: player.posADP,
    };
};

export const getAvailablePlayersSnapshot = (
    players: RawAdpPlayer[],
    draftedPlayerIds: string[],
    limit = 40
) => {
    const draftedIds = new Set(draftedPlayerIds);

    return players
        .filter((player) => !draftedIds.has(String(player.playerID ?? player.longName ?? "")))
        .slice(0, limit)
        .map(toAiPlayer);
};

export const getNextUserPick = (
    currentOverallPick: number,
    totalTeams: number,
    userPickNumber: number,
    draftOrder: "Snake" | "Linear"
) => {
    const safeTeams = Math.max(totalTeams, 1);
    const safeUserPick = Math.min(Math.max(userPickNumber, 1), safeTeams);

    for (let overallPick = currentOverallPick + 1; overallPick <= currentOverallPick + safeTeams * 2; overallPick += 1) {
        const round = Math.ceil(overallPick / safeTeams);
        const pickInRound = ((overallPick - 1) % safeTeams) + 1;
        const teamOnClock = draftOrder === "Linear" || round % 2 === 1
            ? pickInRound
            : safeTeams - pickInRound + 1;

        if (teamOnClock === safeUserPick) {
            return overallPick;
        }
    }

    return undefined;
};
