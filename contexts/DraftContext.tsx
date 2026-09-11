import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { ROSTER_SIZE, useRoster } from "@/contexts/RosterContext";

type LeagueFormat = "PPR" | "Standard" | "Half-PPR";
type DraftOrder = "Snake" | "Linear";
export type DraftStatus = "idle" | "active" | "complete";

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
    status: DraftStatus;                     // Lifecycle state for the current draft
    isDraftComplete: boolean;                // Whether the final configured pick has been made
    totalRounds: number;                     // Fixed roster-driven round count
    totalPicks: number;                      // Total picks across every team
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
    isUserPickTimedOut: boolean;             // Whether the current user pick needs auto-draft resolution
    timeoutError?: string;                   // Why timeout auto-drafting could not complete

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
    resetDraft: () => void;
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: () => void;
    tickTimer: () => void;
    resolveTimedOutUserPick: (playerId: string) => boolean;
    failTimedOutUserPick: (message: string) => void;
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
    draftOrder: DraftOrder,
    totalPicks: number
) => {
    const safeTeams = Math.max(totalTeams, 1);
    const safeUserPick = Math.min(Math.max(userPickNumber, 1), safeTeams);

    const searchThroughPick = Math.min(currentOverallPick + safeTeams * 2, totalPicks);

    for (let overallPick = currentOverallPick + 1; overallPick <= searchThroughPick; overallPick += 1) {
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
    const { resetRoster } = useRoster();

    // Core draft state
    const [currentOverallPick, setCurrentOverallPick] = useState(1);
    const [timeLeft, setTimeLeft] = useState(60);
    const [timerDuration, setTimerDuration] = useState(60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [status, setStatus] = useState<DraftStatus>("idle");
    const [draftedPlayerIds, setDraftedPlayerIds] = useState<string[]>([]);
    const [isUserPickTimedOut, setIsUserPickTimedOut] = useState(false);
    const [timeoutError, setTimeoutError] = useState<string | undefined>();
    const lastBotDraftedOverallPickRef = useRef<number | null>(null);
    const timedOutOverallPickRef = useRef<number | null>(null);
    const isTimerBlockedRef = useRef(false);
    const currentOverallPickRef = useRef(1);
    const statusRef = useRef<DraftStatus>("idle");

    // Setup state (filled from DraftSetup screen)
    const [totalTeams, setTotalTeams] = useState(6); // will be set in setup
    const [userPickNumber, setUserPickNumber] = useState(1); // will be set in setup
    const [draftOrder, setDraftOrder] = useState<DraftOrder>("Snake");

    // League format (default = PPR)
    const [leagueFormat, setLeagueFormat] = useState<LeagueFormat>("PPR");
    const totalRounds = ROSTER_SIZE;
    const totalPicks = totalTeams * totalRounds;
    const isDraftComplete = status === "complete";

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

    const isUserTurn = status === "active" && teamOnClock === userPickNumber;
    const isBotPickPending = status === "active" && !isUserTurn;

    const nextUserPick = useMemo(
        () => status === "active"
            ? getNextUserPick(currentOverallPick, totalTeams, userPickNumber, draftOrder, totalPicks)
            : undefined,
        [currentOverallPick, draftOrder, status, totalPicks, totalTeams, userPickNumber]
    );

    const picksUntilNextUserPick = nextUserPick ? nextUserPick - currentOverallPick : undefined;

    const resetTimer = useCallback(() => {
        if (statusRef.current !== "active") {
            return;
        }
        setTimeLeft(timerDuration);
    }, [timerDuration]);

    const advancePick = useCallback(() => {
        if (statusRef.current !== "active") {
            return;
        }

        timedOutOverallPickRef.current = null;
        setIsUserPickTimedOut(false);
        setTimeoutError(undefined);

        if (currentOverallPickRef.current >= totalPicks) {
            statusRef.current = "complete";
            isTimerBlockedRef.current = true;
            setStatus("complete");
            setIsTimerRunning(false);
            setTimeLeft(0);
            return;
        }

        currentOverallPickRef.current += 1;
        isTimerBlockedRef.current = false;
        setCurrentOverallPick(currentOverallPickRef.current);
        setTimeLeft(timerDuration);
    }, [timerDuration, totalPicks]);

    const recordDraftedPlayer = useCallback((playerId: string) => {
        if (!playerId) {
            return;
        }

        setDraftedPlayerIds((currentIds) => (
            currentIds.includes(playerId) ? currentIds : [...currentIds, playerId]
        ));
    }, []);

    const draftNextAvailablePlayer = useCallback((players: DraftablePlayer[]) => {
        if (status !== "active" || isUserTurn || lastBotDraftedOverallPickRef.current === currentOverallPick) {
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
        isUserTurn,
        recordDraftedPlayer,
        status,
    ]);

    const tickTimer = useCallback(() => {
        if (statusRef.current !== "active" || !isTimerRunning || !isUserTurn) {
            return;
        }

        setTimeLeft((currentTime) => {
            if (currentTime <= 1) {
                timedOutOverallPickRef.current = currentOverallPick;
                isTimerBlockedRef.current = true;
                setIsTimerRunning(false);
                setIsUserPickTimedOut(true);
                setTimeoutError(undefined);
                return 0;
            }

            return currentTime - 1;
        });
    }, [currentOverallPick, isTimerRunning, isUserTurn]);

    const resolveTimedOutUserPick = useCallback((playerId: string) => {
        if (statusRef.current !== "active" || !playerId || timedOutOverallPickRef.current !== currentOverallPick) {
            return false;
        }

        timedOutOverallPickRef.current = null;
        recordDraftedPlayer(playerId);
        advancePick();
        return true;
    }, [advancePick, currentOverallPick, recordDraftedPlayer]);

    const failTimedOutUserPick = useCallback((message: string) => {
        if (statusRef.current !== "active" || timedOutOverallPickRef.current !== currentOverallPick) {
            return;
        }

        timedOutOverallPickRef.current = null;
        setIsUserPickTimedOut(false);
        setIsTimerRunning(false);
        setTimeoutError(message);
    }, [currentOverallPick]);

    const resetDraft = useCallback(() => {
        currentOverallPickRef.current = 1;
        statusRef.current = "idle";
        setCurrentOverallPick(1);
        setTimeLeft(timerDuration);
        setIsTimerRunning(false);
        setStatus("idle");
        setDraftedPlayerIds([]);
        setIsUserPickTimedOut(false);
        setTimeoutError(undefined);
        lastBotDraftedOverallPickRef.current = null;
        timedOutOverallPickRef.current = null;
        isTimerBlockedRef.current = false;
    }, [timerDuration]);

    const configureDraft = useCallback((options: ConfigureDraftOptions) => {
        const safeTimerDuration = Math.max(options.timerDuration, 1);
        const safeTotalTeams = Math.max(options.totalTeams, 1);
        const safeUserPickNumber = Math.min(Math.max(options.userPickNumber, 1), safeTotalTeams);

        resetRoster();
        currentOverallPickRef.current = 1;
        statusRef.current = "active";
        setCurrentOverallPick(1);
        setTimeLeft(safeTimerDuration);
        setTimerDuration(safeTimerDuration);
        setTotalTeams(safeTotalTeams);
        setUserPickNumber(safeUserPickNumber);
        setLeagueFormat(options.leagueFormat);
        setDraftOrder(options.draftOrder);
        setDraftedPlayerIds([]);
        setIsUserPickTimedOut(false);
        setTimeoutError(undefined);
        lastBotDraftedOverallPickRef.current = null;
        timedOutOverallPickRef.current = null;
        isTimerBlockedRef.current = false;
        setIsTimerRunning(true);
        setStatus("active");
    }, [resetRoster]);

    const startTimer = useCallback(() => {
        if (statusRef.current !== "active" || isTimerBlockedRef.current) {
            return;
        }
        setIsTimerRunning(true);
    }, []);

    const pauseTimer = useCallback(() => {
        setIsTimerRunning(false);
    }, []);

    const contextValue = useMemo(
        () => ({
            currentOverallPick,
            status,
            isDraftComplete,
            totalRounds,
            totalPicks,
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
            isUserPickTimedOut,
            timeoutError,
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
            resetDraft,
            startTimer,
            pauseTimer,
            resetTimer,
            tickTimer,
            resolveTimedOutUserPick,
            failTimedOutUserPick,
            advancePick,
            recordDraftedPlayer,
            draftNextAvailablePlayer,
        }),
        [
            currentOverallPick,
            status,
            isDraftComplete,
            totalRounds,
            totalPicks,
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
            isUserPickTimedOut,
            timeoutError,
            totalTeams,
            userPickNumber,
            draftOrder,
            draftedPlayerIds,
            leagueFormat,
            configureDraft,
            resetDraft,
            startTimer,
            pauseTimer,
            resetTimer,
            tickTimer,
            resolveTimedOutUserPick,
            failTimedOutUserPick,
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
