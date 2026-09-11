import type { Player, Roster } from "@/contexts/RosterContext";

const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:8000";

export type PlayerAnalysisVerdict = "STEAL" | "GOOD VALUE" | "FAIR VALUE" | "REACH";

export type PlayerAnalysisResult = {
    verdict: PlayerAnalysisVerdict;
    explanation: string;
};

type PlayerAnalysisInput = Partial<Player> & {
    currentOverallPick?: number;
    nextUserPick?: number;
    picksUntilNextUserPick?: number;
    teamOnClock?: number;
    totalTeams?: number;
    userPickNumber?: number;
    draftOrder?: string;
    leagueFormat?: string;
    league?: string;
    draftedPlayerIds?: string[];
    availablePlayers?: unknown[];
};

const VALID_VERDICTS: ReadonlySet<string> = new Set([
    "STEAL",
    "GOOD VALUE",
    "FAIR VALUE",
    "REACH",
]);

const buildDraftId = (playerData: PlayerAnalysisInput) => {
    const safePlayerId = playerData.id || playerData.name || "unknown-player";
    const safeOverallPick = playerData.currentOverallPick || `${playerData.round || "unknown-round"}-${playerData.pick || "unknown-pick"}`;

    return `${safePlayerId}-${safeOverallPick}`;
};

const normalizePosition = (posADP?: string) => {
    const safePosADP = posADP || "";
    const positionMatch = safePosADP.match(/[A-Za-z]+/);
    const rankMatch = safePosADP.match(/\d+/);

    return {
        position: positionMatch ? positionMatch[0].toUpperCase() : safePosADP,
        positionRank: rankMatch ? Number(rankMatch[0]) : undefined,
    };
};

const buildPlayerPayload = (player: Player | null) => {
    if (!player) {
        return null;
    }

    const normalized = player.positionRank
        ? { position: player.position, positionRank: player.positionRank }
        : normalizePosition(player.posADP || player.position);

    return {
        id: player.id || player.name || "",
        name: player.name || "",
        position: normalized.position || player.position || "",
        team: player.team,
        position_rank: normalized.positionRank,
        overall_adp: player.overallADP ?? player.adp,
        pos_adp: player.posADP,
    };
};

const buildRosterPayload = (roster: Roster) => ({
    qb: buildPlayerPayload(roster.qb),
    rb: roster.rb.map(buildPlayerPayload),
    wr: roster.wr.map(buildPlayerPayload),
    te: buildPlayerPayload(roster.te),
    flex: buildPlayerPayload(roster.flex),
    dst: buildPlayerPayload(roster.dst),
    k: buildPlayerPayload(roster.k),
    bench: roster.bench.map(buildPlayerPayload),
});

const parseAnalysisResponse = (data: unknown): PlayerAnalysisResult => {
    if (!data || typeof data !== "object") {
        throw new Error("Unexpected backend response structure");
    }

    const response = data as { verdict?: unknown; explanation?: unknown };

    if (
        typeof response.verdict !== "string" ||
        !VALID_VERDICTS.has(response.verdict) ||
        typeof response.explanation !== "string" ||
        !response.explanation.trim()
    ) {
        throw new Error("Unexpected backend response structure");
    }

    return {
        verdict: response.verdict as PlayerAnalysisVerdict,
        explanation: response.explanation,
    };
};

export const generatePlayerAnalysis = async (
    playerData: PlayerAnalysisInput,
    roster: Roster,
    signal?: AbortSignal
): Promise<PlayerAnalysisResult> => {
    const payload = {
        draft_id: buildDraftId(playerData),
        player: {
            id: playerData.id || "",
            name: playerData.name || "",
            position: playerData.position || "",
            team: playerData.team || "",
            position_rank: playerData.positionRank,
            overall_adp: playerData.overallADP,
            pos_adp: playerData.posADP,
        },
        context: {
            round: playerData.round,
            pick: playerData.pick,
            current_overall_pick: playerData.currentOverallPick,
            next_user_pick: playerData.nextUserPick,
            picks_until_next_user_pick: playerData.picksUntilNextUserPick,
            team_on_clock: playerData.teamOnClock,
            total_teams: playerData.totalTeams,
            user_pick_number: playerData.userPickNumber,
            draft_order: playerData.draftOrder,
            league_format: playerData.leagueFormat,
            league: playerData.league,
        },
        roster: buildRosterPayload(roster),
        drafted_player_ids: playerData.draftedPlayerIds || [],
        available_players: playerData.availablePlayers || [],
    };

    const healthResponse = await fetch(`${BACKEND_BASE_URL}/health`, { signal });
    if (!healthResponse.ok) {
        throw new Error(`Backend health check failed at ${BACKEND_BASE_URL}/health`);
    }

    const response = await fetch(`${BACKEND_BASE_URL}/draft/recommend`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
    }

    return parseAnalysisResponse(await response.json());
};
