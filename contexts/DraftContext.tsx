import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type LeagueFormat = "PPR" | "Standard" | "Half-PPR";
type DraftOrder = "Snake" | "Linear";

type ConfigureDraftOptions = {
    timerDuration: number;
    totalTeams: number;
    userPickNumber: number;
    leagueFormat: LeagueFormat;
    draftOrder: DraftOrder;
};

type DraftablePlayer = {
    playerID?: string | number;
    longName?: string;
};

// 1. Define the shape of the context (all the data the draft needs)
type DraftContextType = {
    // Draft state
    currentOverallPick: number;              // Current overall draft pick cursor
    round: number;                           // Current draft round (starts at 1)
    pick: number;                            // Current pick within the round (starts at 1)
    nextUserPick?: number;                   // Next overall pick owned by the user
    picksUntilNextUserPick?: number;         // Distance from current pick to next user pick
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
    draftedPlayerIds: string[];              // Player IDs already selected in this draft

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
    recordDraftedPlayer: (playerId: string) => void;
    draftNextAvailablePlayer: (players: DraftablePlayer[]) => string | undefined;
};

// 2. Create the context
const DraftContext = createContext<DraftContextType | undefined>(undefined);

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

const getNextUserPick = (
    currentOverallPick: number,
    totalTeams: number,
    userPickNumber: number,
    draftOrder: DraftOrder
) => {
    const safeTeams = Math.max(totalTeams, 1);
    const safeUserPick = Math.min(Math.max(userPickNumber, 1), safeTeams);

    for (let overallPick = currentOverallPick + 1; overallPick <= currentOverallPick + safeTeams * 2; overallPick += 1) {
        const roundForPick = getRoundFromOverallPick(overallPick, safeTeams);
        const pickInRound = getPickInRoundFromOverallPick(overallPick, safeTeams);
        const teamForPick = getTeamOnClock(roundForPick, pickInRound, safeTeams, draftOrder);

        if (teamForPick === safeUserPick) {
            return overallPick;
        }
    }

    return undefined;
};

// 3. Provider that holds all draft state
export const DraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Core draft state
    const [currentOverallPick, setCurrentOverallPick] = useState(1);
    const [timeLeft, setTimeLeft] = useState(60);
    const [timerDuration, setTimerDuration] = useState(60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isDraftConfigured, setIsDraftConfigured] = useState(false);
    const [draftedPlayerIds, setDraftedPlayerIds] = useState<string[]>([]);
    const lastBotDraftedOverallPickRef = useRef<number | null>(null);

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

    const nextUserPick = useMemo(
        () => getNextUserPick(currentOverallPick, totalTeams, userPickNumber, draftOrder),
        [currentOverallPick, draftOrder, totalTeams, userPickNumber]
    );

    const picksUntilNextUserPick = nextUserPick ? nextUserPick - currentOverallPick : undefined;

    const resetTimer = useCallback(() => {
        setTimeLeft(timerDuration);
    }, [timerDuration]);

    const advancePick = useCallback(() => {
        setCurrentOverallPick((currentPick) => currentPick + 1);
        setTimeLeft(timerDuration);
    }, [timerDuration]);

    const recordDraftedPlayer = useCallback((playerId: string) => {
        if (!playerId) {
            return;
        }

        setDraftedPlayerIds((currentIds) => (
            currentIds.includes(playerId) ? currentIds : [...currentIds, playerId]
        ));
    }, []);

    const draftNextAvailablePlayer = useCallback((players: DraftablePlayer[]) => {
        if (!isDraftConfigured || isUserTurn || lastBotDraftedOverallPickRef.current === currentOverallPick) {
            return undefined;
        }

        const draftedIds = new Set(draftedPlayerIds);
        const nextPlayer = players.find((player) => {
            const playerId = String(player.playerID ?? player.longName ?? "");
            return playerId && !draftedIds.has(playerId);
        });

        if (!nextPlayer) {
            return undefined;
        }

        const nextPlayerId = String(nextPlayer.playerID ?? nextPlayer.longName ?? "");
        lastBotDraftedOverallPickRef.current = currentOverallPick;
        recordDraftedPlayer(nextPlayerId);
        advancePick();

        return nextPlayerId;
    }, [
        advancePick,
        currentOverallPick,
        draftedPlayerIds,
        isDraftConfigured,
        isUserTurn,
        recordDraftedPlayer,
    ]);

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

        setCurrentOverallPick(1);
        setTimeLeft(safeTimerDuration);
        setTimerDuration(safeTimerDuration);
        setTotalTeams(safeTotalTeams);
        setUserPickNumber(safeUserPickNumber);
        setLeagueFormat(options.leagueFormat);
        setDraftOrder(options.draftOrder);
        setDraftedPlayerIds([]);
        lastBotDraftedOverallPickRef.current = null;
        setIsTimerRunning(true);
        setIsDraftConfigured(true);
    }, []);

    const startTimer = useCallback(() => {
        setIsTimerRunning(true);
    }, []);

    const pauseTimer = useCallback(() => {
        setIsTimerRunning(false);
    }, []);

    const contextValue = useMemo(
        () => ({
            currentOverallPick,
            round,
            pick,
            nextUserPick,
            picksUntilNextUserPick,
            teamOnClock,
            isUserTurn,
            isBotPickPending,
            timeLeft,
            timerDuration,
            isTimerRunning,
            totalTeams,
            userPickNumber,
            draftOrder,
            draftedPlayerIds,
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
            recordDraftedPlayer,
            draftNextAvailablePlayer,
        }),
        [
            currentOverallPick,
            round,
            pick,
            nextUserPick,
            picksUntilNextUserPick,
            teamOnClock,
            isUserTurn,
            isBotPickPending,
            timeLeft,
            timerDuration,
            isTimerRunning,
            totalTeams,
            userPickNumber,
            draftOrder,
            draftedPlayerIds,
            leagueFormat,
            configureDraft,
            startTimer,
            pauseTimer,
            resetTimer,
            tickTimer,
            advancePick,
            recordDraftedPlayer,
            draftNextAvailablePlayer,
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
