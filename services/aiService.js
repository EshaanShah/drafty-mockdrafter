const GOOGLE_API_KEY = "AIzaSyDQSiQ88U62wguTS2lQHq2i9vyflRT8A9c"

export const generatePlayerAnalysis = async (playerData, roster) => {
    // Format the roster data
    const rosterString = roster ? JSON.stringify({
        qb: roster.qb?.name || "Empty",
        rb: roster.rb?.map(p => p.name) || [],
        wr: roster.wr?.map(p => p.name) || [],
        flex: roster.flex?.name || "Empty",
        bench: roster.bench?.map(p => p.name) || []
    }) : "No roster data";

    const prompt = `Analyze this fantasy football player for draft advice:
You are a fantasy football expert. Is drafting ${playerData.name} at Round ${playerData.round || 'Unknown'}, 
Pick ${playerData.pick || 'Unknown'} in a ${playerData.league || '12-team PPR'} league a good move given my roster: ${rosterString}?
Use 2024 stats and 2025 projections from ESPN, Sleeper, and NFL.com only.
Include PPG, ADP vs this draft slot, injury history, and team context.
Speak like a FantasyPros analyst.
End with a clear verdict: "Good Value," "Fair Value," or "Reach."
Keep response under 100 words.`;

    try {
        // Try gemini-1.5-flash instead of gemini-pro
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
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