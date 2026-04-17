const BACKEND_BASE_URL = 'http://localhost:8000';

const buildDraftId = (playerData) => {
    const safeName = playerData.name || 'unknown-player';
    const safeRound = playerData.round || 'unknown-round';
    const safePick = playerData.pick || 'unknown-pick';

    return `${safeName}-${safeRound}-${safePick}`;
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

const buildRosterPayload = (roster) => {
    if (!roster) {
        return null;
    }

    return {
        qb: roster.qb,
        rb: roster.rb || [],
        wr: roster.wr || [],
        flex: roster.flex,
        bench: roster.bench || [],
    };
};

export const generatePlayerAnalysis = async (playerData, roster) => {
    const payload = {
        draft_id: buildDraftId(playerData),
        player: {
            name: playerData.name || '',
            position: playerData.position || '',
            team: playerData.team || '',
        },
        context: {
            round: playerData.round,
            pick: playerData.pick,
            league: playerData.league,
        },
        roster: buildRosterPayload(roster),
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
