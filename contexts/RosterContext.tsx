// contexts/RosterContext.tsx
import React, { createContext, useCallback, useContext, useState } from "react";

export type Player = {
    id: string;
    name: string;
    position: string;
    team?: string;
    round?: number;
    pick?: number;
    positionRank?: number;
    posADP?: string;
    overallADP?: number;
    adp?: number;
    proj?: number;
    ppg?: number;
};

export type Roster = {
    qb: Player | null;
    rb: Player[];
    wr: Player[];
    te: Player | null;
    flex: Player | null;
    dst: Player | null;
    k: Player | null;
    bench: Player[];
};

export type RosterConfig = Readonly<{
    qb: number;
    rb: number;
    wr: number;
    te: number;
    flex: number;
    dst: number;
    k: number;
    bench: number;
}>;

export const DEFAULT_ROSTER_CONFIG: RosterConfig = Object.freeze({
    qb: 1,
    rb: 2,
    wr: 2,
    te: 1,
    flex: 1,
    dst: 1,
    k: 1,
    bench: 4,
});

export const STARTER_ROSTER_SIZE =
    DEFAULT_ROSTER_CONFIG.qb +
    DEFAULT_ROSTER_CONFIG.rb +
    DEFAULT_ROSTER_CONFIG.wr +
    DEFAULT_ROSTER_CONFIG.te +
    DEFAULT_ROSTER_CONFIG.flex +
    DEFAULT_ROSTER_CONFIG.dst +
    DEFAULT_ROSTER_CONFIG.k;

export const ROSTER_SIZE = STARTER_ROSTER_SIZE + DEFAULT_ROSTER_CONFIG.bench;

type AddResult = {
    success: boolean;
    message?: string;
};

type RosterContextType = {
    roster: Roster;
    rosterConfig: RosterConfig;
    rosterSize: number;
    addPlayer: (player: Player) => AddResult;
    canAddPlayer: (player: Player) => boolean;
    resetRoster: () => void;
    removePlayer: (playerId: string) => boolean;
    isPlayerDrafted: (playerId: string) => boolean;
    getRosterStatus: () => { qb: number; rb: number; wr: number; te: number; flex: number; dst: number; k: number; bench: number };
};

const createInitialRoster = (): Roster => ({
    qb: null,
    rb: [],
    wr: [],
    te: null,
    flex: null,
    dst: null,
    k: null,
    bench: [],
});

export const RosterContext = createContext<RosterContextType | undefined>(undefined);

export const RosterProvider = ({ children }: { children: React.ReactNode }) => {
    const [roster, setRoster] = useState<Roster>(createInitialRoster);

    const resetRoster = useCallback(() => {
        setRoster(createInitialRoster());
    }, []);

    // Helper function to extract base position from "WR2", "RB15", "QB8", etc.
    const getBasePosition = (position: string): string => {
        if (!position) return "";

        // Remove numbers and normalize to uppercase
        const basePos = position.replace(/\d+/g, '').toUpperCase().trim();

        // Handle common variations
        if (basePos === 'DST' || basePos === 'DEF') return 'DST';
        if (basePos === 'PK' || basePos === 'K') return 'K';

        return basePos; // Returns QB, RB, WR, TE, etc.
    };

    const isPlayerInRoster = (playerId: string) => {
        if (roster.qb?.id === playerId) return true;
        if (roster.te?.id === playerId) return true;
        if (roster.flex?.id === playerId) return true;
        if (roster.dst?.id === playerId) return true;
        if (roster.k?.id === playerId) return true;
        if (roster.rb.some((p) => p.id === playerId)) return true;
        if (roster.wr.some((p) => p.id === playerId)) return true;
        if (roster.bench.some((p) => p.id === playerId)) return true;
        return false;
    };

    const canAddPlayer = (player: Player) => {
        if (isPlayerInRoster(player.id)) {
            return false;
        }

        const normalizedPos = getBasePosition(player.position);
        const benchHasSpace = roster.bench.length < DEFAULT_ROSTER_CONFIG.bench;

        if (normalizedPos === "QB") return !roster.qb || benchHasSpace;
        if (normalizedPos === "RB") return roster.rb.length < DEFAULT_ROSTER_CONFIG.rb || !roster.flex || benchHasSpace;
        if (normalizedPos === "WR") return roster.wr.length < DEFAULT_ROSTER_CONFIG.wr || !roster.flex || benchHasSpace;
        if (normalizedPos === "TE") return !roster.te || !roster.flex || benchHasSpace;
        if (normalizedPos === "DST") return !roster.dst || benchHasSpace;
        if (normalizedPos === "K") return !roster.k || benchHasSpace;
        if (normalizedPos === "FLEX") return !roster.flex || benchHasSpace;

        return benchHasSpace;
    };

    const addPlayer = (player: Player): AddResult => {
        // Use the helper function to get base position
        const normalizedPos = getBasePosition(player.position);

        console.log(`Adding player: ${player.name}, Original position: ${player.position}, Normalized: ${normalizedPos}`);

        // prevent duplicates
        if (isPlayerInRoster(player.id)) {
            return { success: false, message: "Player already on roster" };
        }

        const benchHasSpace = (r: Roster) => r.bench.length < DEFAULT_ROSTER_CONFIG.bench;

        // update function
        let result: AddResult = { success: false, message: "Unknown error" };

        setRoster((prev) => {
            const next = { ...prev, rb: [...prev.rb], wr: [...prev.wr], bench: [...prev.bench] };

            // QB logic (single slot)
            if (normalizedPos === "QB") {
                if (!next.qb) {
                    next.qb = player;
                    result = { success: true, message: "Added to QB position" };
                    return next;
                }
                // move current QB to bench if possible, then place new QB
                if (benchHasSpace(next)) {
                    next.bench.push(next.qb as Player);
                    next.qb = player;
                    result = { success: true, message: "Existing QB moved to bench, new QB added" };
                    return next;
                }
                result = { success: false, message: "No bench space to move existing QB" };
                return prev;
            }

            // RB logic (max 2)
            if (normalizedPos === "RB") {
                if (next.rb.length < DEFAULT_ROSTER_CONFIG.rb) {
                    next.rb.push(player);
                    result = { success: true, message: `Added to RB position (${next.rb.length}/${DEFAULT_ROSTER_CONFIG.rb})` };
                    return next;
                }
                if (!next.flex) {
                    next.flex = player;
                    result = { success: true, message: "RB positions full: added to FLEX" };
                    return next;
                }
                if (benchHasSpace(next)) {
                    next.bench.push(player);
                    result = { success: true, message: "RB positions full: added to bench" };
                    return next;
                }
                result = { success: false, message: "RB slots + bench full" };
                return prev;
            }

            // WR logic (max 2)
            if (normalizedPos === "WR") {
                if (next.wr.length < DEFAULT_ROSTER_CONFIG.wr) {
                    next.wr.push(player);
                    result = { success: true, message: `Added to WR position (${next.wr.length}/${DEFAULT_ROSTER_CONFIG.wr})` };
                    return next;
                }
                if (!next.flex) {
                    next.flex = player;
                    result = { success: true, message: "WR positions full: added to FLEX" };
                    return next;
                }
                if (benchHasSpace(next)) {
                    next.bench.push(player);
                    result = { success: true, message: "WR positions full: added to bench" };
                    return next;
                }
                result = { success: false, message: "WR slots + bench full" };
                return prev;
            }

            // TE logic -> treat TE as its own position first
            if (normalizedPos === "TE") {
                if (!next.te) {
                    next.te = player;
                    result = { success: true, message: "Added to TE position" };
                    return next;
                }
                // TE slot occupied, try flex
                if (!next.flex) {
                    next.flex = player;
                    result = { success: true, message: "TE slot full: added to FLEX" };
                    return next;
                }
                // both TE and flex occupied -> try bench
                if (benchHasSpace(next)) {
                    next.bench.push(player);
                    result = { success: true, message: "TE and FLEX full: added to bench" };
                    return next;
                }
                result = { success: false, message: "TE, FLEX, and bench full" };
                return prev;
            }

            // DST logic
            if (normalizedPos === "DST") {
                if (!next.dst) {
                    next.dst = player;
                    result = { success: true, message: "Added to DST position" };
                    return next;
                }
                // DST occupied -> bench if possible
                if (benchHasSpace(next)) {
                    next.bench.push(next.dst as Player);
                    next.dst = player;
                    result = { success: true, message: "Existing DST moved to bench, new DST added" };
                    return next;
                }
                result = { success: false, message: "No bench space to move existing DST" };
                return prev;
            }

            // K logic
            if (normalizedPos === "K") {
                if (!next.k) {
                    next.k = player;
                    result = { success: true, message: "Added to K position" };
                    return next;
                }
                // K occupied -> bench if possible
                if (benchHasSpace(next)) {
                    next.bench.push(next.k as Player);
                    next.k = player;
                    result = { success: true, message: "Existing K moved to bench, new K added" };
                    return next;
                }
                result = { success: false, message: "No bench space to move existing K" };
                return prev;
            }

            // FLEX request or any other position
            if (normalizedPos === "FLEX") {
                if (!next.flex) {
                    next.flex = player;
                    result = { success: true, message: "Added to FLEX position" };
                    return next;
                }
                if (benchHasSpace(next)) {
                    next.bench.push(player);
                    result = { success: true, message: "FLEX full: added to bench" };
                    return next;
                }
                result = { success: false, message: "FLEX + bench full" };
                return prev;
            }

            // fallback: other positions go to bench if space
            if (benchHasSpace(next)) {
                next.bench.push(player);
                result = { success: true, message: `Unknown position (${normalizedPos}): added to bench` };
                return next;
            }
            result = { success: false, message: "Bench full - cannot add player" };
            return prev;
        });

        return result;
    };

    const removePlayer = (playerId: string): boolean => {
        let removed = false;
        setRoster((prev) => {
            const next: Roster = {
                qb: prev.qb && prev.qb.id === playerId ? null : prev.qb,
                rb: prev.rb.filter((p) => {
                    if (p.id === playerId) removed = true;
                    return p.id !== playerId;
                }),
                wr: prev.wr.filter((p) => {
                    if (p.id === playerId) removed = true;
                    return p.id !== playerId;
                }),
                te: prev.te && prev.te.id === playerId ? null : prev.te,
                flex: prev.flex && prev.flex.id === playerId ? null : prev.flex,
                dst: prev.dst && prev.dst.id === playerId ? null : prev.dst,
                k: prev.k && prev.k.id === playerId ? null : prev.k,
                bench: prev.bench.filter((p) => {
                    if (p.id === playerId) removed = true;
                    return p.id !== playerId;
                }),
            };
            // also check other single position removals
            if (prev.qb?.id === playerId || prev.te?.id === playerId || prev.dst?.id === playerId || prev.k?.id === playerId) {
                removed = true;
            }
            return next;
        });
        return removed;
    };

    const isPlayerDrafted = (playerId: string) => isPlayerInRoster(playerId);

    const getRosterStatus = () => ({
        qb: roster.qb ? 1 : 0,
        rb: roster.rb.length,
        wr: roster.wr.length,
        te: roster.te ? 1 : 0,
        flex: roster.flex ? 1 : 0,
        dst: roster.dst ? 1 : 0,
        k: roster.k ? 1 : 0,
        bench: roster.bench.length,
    });

    const contextValue: RosterContextType = {
        roster,
        rosterConfig: DEFAULT_ROSTER_CONFIG,
        rosterSize: ROSTER_SIZE,
        addPlayer,
        canAddPlayer,
        resetRoster,
        removePlayer,
        isPlayerDrafted,
        getRosterStatus,
    };

    return <RosterContext.Provider value={contextValue}>{children}</RosterContext.Provider>;
};

export const useRoster = (): RosterContextType => {
    const ctx = useContext(RosterContext);
    if (!ctx) throw new Error("useRoster must be used inside a RosterProvider");
    return ctx;
};
