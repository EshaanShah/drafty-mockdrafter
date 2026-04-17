import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type LeagueFormat = "PPR" | "Standard" | "Half-PPR";
type DraftOrder = "Snake" | "Linear";

type ConfigureDraftOptions = {
    timerDuration: number;
    totalTeams: number;
    userPickNumber: number;
    leagueFormat: LeagueFormat;
    draftOrder: DraftOrder;
};

// 1. Define the shape of the context (all the data the draft needs)
type DraftContextType = {
    // Draft state
    currentOverallPick: number;              // Current overall draft pick cursor
    round: number;                           // Current draft round (starts at 1)
    pick: number;                            // Current pick within the round (starts at 1)
    teamOnClock: number;                     // Draft position currently making a pick
    isUserTurn: boolean;                     // Whether the user can draft right now
    isBotPickPending: boolean;               // Placeholder state for future bot picks
    timeLeft: number;                        // Countdown timer (seconds left for current pick)
    timerDuration: number;                   // Pick timer duration from setup
    isTimerRunning: boolean;                 // Whether the draft timer should tick

    // Draft setup info (coming from DraftSetup screen)
    totalTeams: number;                      // How many teams are drafting (e.g. 12)
    userPickNumber: number;                  // The user’s pick position (e.g. 7th overall)
    draftOrder: DraftOrder;                  // Snake or linear draft order

    // League info
    leagueFormat: LeagueFormat;              // Default is PPR

    // State setters
    setTimeLeft: (time: number) => void;
    setTotalTeams: (teams: number) => void;
    setUserPickNumber: (pick: number) => void;
    setLeagueFormat: (format: LeagueFormat) => void;

    // Draft actions
    configureDraft: (options: ConfigureDraftOptions) => void;
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: () => void;
    tickTimer: () => void;
    advancePick: () => void;
};

// 2. Create the context
const DraftContext = createContext<DraftContextType | undefined>(undefined);

const BOT_PICK_DELAY_MS = 850;

const getRoundFromOverallPick = (overallPick: number, totalTeams: number) => {
    const safeTeams = Math.max(totalTeams, 1);
    return Math.ceil(Math.max(overallPick, 1) / safeTeams);
};

const getPickInRoundFromOverallPick = (overallPick: number, totalTeams: number) => {
    const safeTeams = Math.max(totalTeams, 1);
    return ((Math.max(overallPick, 1) - 1) % safeTeams) + 1;
};

const getTeamOnClock = (round: number, pick: number, totalTeams: number, draftOrder: DraftOrder) => {
    if (draftOrder === "Linear" || round % 2 === 1) {
        return pick;
    }

    return Math.max(totalTeams, 1) - pick + 1;
};

// 3. Provider that holds all draft state
export const DraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Core draft state
    const [currentOverallPick, setCurrentOverallPick] = useState(1);
    const [timeLeft, setTimeLeft] = useState(60);
    const [timerDuration, setTimerDuration] = useState(60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isDraftConfigured, setIsDraftConfigured] = useState(false);

    // Setup state (filled from DraftSetup screen)
    const [totalTeams, setTotalTeams] = useState(6); // will be set in setup
    const [userPickNumber, setUserPickNumber] = useState(1); // will be set in setup
    const [draftOrder, setDraftOrder] = useState<DraftOrder>("Snake");

    // League format (default = PPR)
    const [leagueFormat, setLeagueFormat] = useState<LeagueFormat>("PPR");

    const round = useMemo(
        () => getRoundFromOverallPick(currentOverallPick, totalTeams),
        [currentOverallPick, totalTeams]
    );

    const pick = useMemo(
        () => getPickInRoundFromOverallPick(currentOverallPick, totalTeams),
        [currentOverallPick, totalTeams]
    );

    const teamOnClock = useMemo(
        () => getTeamOnClock(round, pick, totalTeams, draftOrder),
        [draftOrder, pick, round, totalTeams]
    );

    const isUserTurn = teamOnClock === userPickNumber;
    const isBotPickPending = !isUserTurn;

    const resetTimer = useCallback(() => {
        setTimeLeft(timerDuration);
    }, [timerDuration]);

    const advancePick = useCallback(() => {
        setCurrentOverallPick((currentPick) => currentPick + 1);
        setTimeLeft(timerDuration);
    }, [timerDuration]);

    const tickTimer = useCallback(() => {
        if (!isTimerRunning || !isUserTurn) {
            return;
        }

        setTimeLeft((currentTime) => {
            if (currentTime <= 1) {
                advancePick();
                return timerDuration;
            }

            return currentTime - 1;
        });
    }, [advancePick, isTimerRunning, isUserTurn, timerDuration]);

    const configureDraft = useCallback((options: ConfigureDraftOptions) => {
        const safeTimerDuration = Math.max(options.timerDuration, 1);
        const safeTotalTeams = Math.max(options.totalTeams, 1);
        const safeUserPickNumber = Math.min(Math.max(options.userPickNumber, 1), safeTotalTeams);

        setCurrentOverallPick(safeUserPickNumber);
        setTimeLeft(safeTimerDuration);
        setTimerDuration(safeTimerDuration);
        setTotalTeams(safeTotalTeams);
        setUserPickNumber(safeUserPickNumber);
        setLeagueFormat(options.leagueFormat);
        setDraftOrder(options.draftOrder);
        setIsTimerRunning(true);
        setIsDraftConfigured(true);
    }, []);

    const startTimer = useCallback(() => {
        setIsTimerRunning(true);
    }, []);

    const pauseTimer = useCallback(() => {
        setIsTimerRunning(false);
    }, []);

    useEffect(() => {
        if (!isDraftConfigured || isUserTurn) {
            return;
        }

        const botPickTimer = setTimeout(() => {
            advancePick();
        }, BOT_PICK_DELAY_MS);

        return () => {
            clearTimeout(botPickTimer);
        };
    }, [advancePick, currentOverallPick, isDraftConfigured, isUserTurn]);

    const contextValue = useMemo(
        () => ({
            currentOverallPick,
            round,
            pick,
            teamOnClock,
            isUserTurn,
            isBotPickPending,
            timeLeft,
            timerDuration,
            isTimerRunning,
            totalTeams,
            userPickNumber,
            draftOrder,
            leagueFormat,
            setTimeLeft,
            setTotalTeams,
            setUserPickNumber,
            setLeagueFormat,
            configureDraft,
            startTimer,
            pauseTimer,
            resetTimer,
            tickTimer,
            advancePick,
        }),
        [
            currentOverallPick,
            round,
            pick,
            teamOnClock,
            isUserTurn,
            isBotPickPending,
            timeLeft,
            timerDuration,
            isTimerRunning,
            totalTeams,
            userPickNumber,
            draftOrder,
            leagueFormat,
            configureDraft,
            startTimer,
            pauseTimer,
            resetTimer,
            tickTimer,
            advancePick,
        ]
    );

    return (
        <DraftContext.Provider value={contextValue}>
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
