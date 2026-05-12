const BACKEND_BASE_URL = 'http://localhost:8000';

const buildDraftId = (playerData) => {
    const safePlayerId = playerData.id || playerData.name || 'unknown-player';
    const safeOverallPick = playerData.currentOverallPick || `${playerData.round || 'unknown-round'}-${playerData.pick || 'unknown-pick'}`;

    return `${safePlayerId}-${safeOverallPick}`;
};

const formatVerdict = (verdict) => {
    switch (verdict) {
        case 'STEAL':
            return 'Steal';
        case 'GOOD VALUE':
            return 'Good Value';
        case 'FAIR VALUE':
            return 'Fair Value';
        case 'REACH':
            return 'Reach';
        default:
            return verdict;
    }
};

const normalizePosition = (posADP) => {
    const safePosADP = posADP || '';
    const positionMatch = safePosADP.match(/[A-Za-z]+/);
    const rankMatch = safePosADP.match(/\d+/);

    return {
        position: positionMatch ? positionMatch[0].toUpperCase() : safePosADP,
        positionRank: rankMatch ? Number(rankMatch[0]) : undefined,
    };
};

const buildPlayerPayload = (player) => {
    if (!player) {
        return null;
    }

    const normalized = player.positionRank
        ? { position: player.position, positionRank: player.positionRank }
        : normalizePosition(player.posADP || player.position);

    return {
        id: player.id || player.name || '',
        name: player.name || '',
        position: normalized.position || player.position || '',
        team: player.team,
        position_rank: normalized.positionRank,
        overall_adp: player.overallADP ?? player.adp,
        pos_adp: player.posADP,
    };
};

const buildRosterPayload = (roster) => {
    if (!roster) {
        return null;
    }

    return {
        qb: buildPlayerPayload(roster.qb),
        rb: (roster.rb || []).map(buildPlayerPayload),
        wr: (roster.wr || []).map(buildPlayerPayload),
        te: buildPlayerPayload(roster.te),
        flex: buildPlayerPayload(roster.flex),
        dst: buildPlayerPayload(roster.dst),
        k: buildPlayerPayload(roster.k),
        bench: (roster.bench || []).map(buildPlayerPayload),
    };
};

export const generatePlayerAnalysis = async (playerData, roster) => {
    const payload = {
        draft_id: buildDraftId(playerData),
        player: {
            id: playerData.id || '',
            name: playerData.name || '',
            position: playerData.position || '',
            team: playerData.team || '',
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

    try {
        const response = await fetch(
            `${BACKEND_BASE_URL}/draft/recommend`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }
        );

        console.log('Response status:', response.status);
        console.log('Response statusText:', response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP Error:', response.status, errorText);
            throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Backend AI Response:', JSON.stringify(data, null, 2));

        if (data.explanation) {
            const verdictLabel = formatVerdict(data.verdict);
            return verdictLabel ? `${verdictLabel}: ${data.explanation}` : data.explanation;
        }

        console.error('Unexpected backend response structure. Full response:', data);
        throw new Error('Unexpected backend response structure');
    } catch (error) {
        console.error('AI API Error:', error);
        return 'Unable to generate analysis at this time.';
    }
};
