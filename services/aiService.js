import { GEMINI_API_KEY } from '@env';

export const generatePlayerAnalysis = async (playerData) => {
    playerData.league = undefined;
    playerData.roster = undefined;
    const prompt =
        `Analyze this fantasy football player for draft advice:
You are a fantasy football expert. Is drafting ${playerData.name} at ${playerData.round}, 
Pick ${playerData.pick} in a ${playerData.league} a good move given my roster: ${playerData.roster}?
Use 2024 stats and 2025 projections from ESPN, Sleeper, and NFL.com only.
Include PPG, ADP vs this draft slot, injury history, and team context.
Speak like a FantasyPros analyst.
End with a clear verdict: “Good Value,” “Fair Value,” or “Reach.”
Keep response under 100 words.
`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
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

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('AI API Error:', error);
        return 'Unable to generate analysis at this time.';
    }
};