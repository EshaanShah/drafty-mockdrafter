const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

export const generatePlayerAnalysis = async (playerData, roster) => {
    // Format the roster data
    const rosterString = roster ? JSON.stringify({
        qb: roster.qb?.name || "Empty",
        rb: roster.rb?.map(p => p.name) || [],
        wr: roster.wr?.map(p => p.name) || [],
        flex: roster.flex?.name || "Empty",
        bench: roster.bench?.map(p => p.name) || []
    }) : "No roster data";

    const prompt = `You are a fantasy football expert. Analyze drafting ${playerData.name} at Round ${playerData.round}, Pick ${playerData.pick} in ${playerData.league}.

ROSTER: ${rosterString || 'Empty - draft best player available'}

## TIER 1 (PRIMARY) - VALUE CHECK:
- Current 2025-2026 season ADP vs this pick position
- Round differential = your baseline verdict

## TIER 2 (ADJUSTERS) - Can move verdict up/down ONE level:
- Roster fit and positional need
- Injury concerns or clean bill of health  
- Team situation changes (new QB, coach, etc.)
- 2024-2025 season performance trends

## TIER 3 (TIEBREAKERS) - Minor influence only:
- Bye week considerations
- Playoff schedule matchups
- Age/longevity concerns

VERDICT LOGIC:
1. Start with ADP differential (Tier 1)
2. Adjust up/down based on Tier 2 factors
3. Use Tier 3 only for close calls

BASE SCALE:
- 2+ rounds below ADP = STEAL
- 1 round below ADP = GOOD VALUE
- At ADP = FAIR VALUE  
- 1+ rounds above ADP = REACH

If elite talent falls significantly, don't overthink it. Response should be in paragraph format
Limit: 120 words.`;

    try {
        // Try gemini-1.5-flash instead of gemini-pro
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
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
        console.log('Full API Response:', JSON.stringify(data, null, 2));

        // Check if there's an error in the response
        if (data.error) {
            console.error('API Error:', data.error);
            throw new Error(`API Error: ${data.error.message}`);
        }

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            console.error('Unexpected response structure. Full response:', data);
            throw new Error('Unexpected API response structure');
        }
    } catch (error) {
        console.error('AI API Error:', error);
        return 'Unable to generate analysis at this time.';
    }
};