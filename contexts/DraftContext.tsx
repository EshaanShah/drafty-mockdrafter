import React, { createContext, useState, useContext } from "react";

// 1. Define the shape of the context (all the data the draft needs)
type DraftContextType = {
    // Draft state
    round: number;                           // Current draft round (starts at 1)
    pick: number;                            // Current pick within the round (starts at 1)
    timeLeft: number;                        // Countdown timer (seconds left for current pick)

    // Draft setup info (coming from DraftSetup screen)
    totalTeams: number;                      // How many teams are drafting (e.g. 12)
    userPickNumber: number;                  // The user’s pick position (e.g. 7th overall)

    // League info
    leagueFormat: "PPR" | "Standard" | "Half-PPR"; // Default is PPR

    // State setters
    setRound: (round: number) => void;
    setPick: (pick: number) => void;
    setTimeLeft: (time: number) => void;
    setTotalTeams: (teams: number) => void;
    setUserPickNumber: (pick: number) => void;
    setLeagueFormat: (format: "PPR" | "Standard" | "Half-PPR") => void;
};

// 2. Create the context
const DraftContext = createContext<DraftContextType | undefined>(undefined);

// 3. Provider that holds all draft state
export const DraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Core draft state
    const [round, setRound] = useState(1);
    const [pick, setPick] = useState(1);
    const [timeLeft, setTimeLeft] = useState(60);

    // Setup state (filled from DraftSetup screen)
    const [totalTeams, setTotalTeams] = useState(0); // will be set in setup
    const [userPickNumber, setUserPickNumber] = useState(0); // will be set in setup

    // League format (default = PPR)
    const [leagueFormat, setLeagueFormat] = useState<"PPR" | "Standard" | "Half-PPR">("PPR");

    return (
        <DraftContext.Provider
            value={{
                round, pick, timeLeft,
                totalTeams, userPickNumber,
                leagueFormat,
                setRound, setPick, setTimeLeft,
                setTotalTeams, setUserPickNumber, setLeagueFormat,
            }}
        >
            {children}
        </DraftContext.Provider>
    );
};

// 4. Custom hook for convenience
export const useDraft = () => {
    const context = useContext(DraftContext);
    if (!context) {
        throw new Error("useDraft must be used inside a DraftProvider");
    }
    return context;
};
