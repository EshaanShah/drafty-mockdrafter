// contexts/RosterContext.tsx
import React, { createContext, useContext, useState } from "react";

export type Player = {
    id: string;
    name: string;
    position: string;
    team?: string;
    adp?: number;
    proj?: number;
    ppg?: number;
};

export type Roster = {
    qb: Player | null;
    rb: Player[];   // max 2
    wr: Player[];   // max 2
    flex: Player | null; // accepts RB/WR/TE (max 1)
    bench: Player[]; // max 4
};

type AddResult = {
    success: boolean;
    message?: string;
};

type RosterContextType = {
    roster: Roster;
    addPlayer: (player: Player) => AddResult;
    removePlayer: (playerId: string) => boolean;
    isPlayerDrafted: (playerId: string) => boolean;
    getRosterStatus: () => { qb: number; rb: number; wr: number; flex: number; bench: number };
};

const initialRoster: Roster = {
    qb: null,
    rb: [],
    wr: [],
    flex: null,
    bench: [],
};

export const RosterContext = createContext<RosterContextType | undefined>(undefined);

export const RosterProvider = ({ children }: { children: React.ReactNode }) => {
    const [roster, setRoster] = useState<Roster>(initialRoster);

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
        if (roster.flex?.id === playerId) return true;
        if (roster.rb.some((p) => p.id === playerId)) return true;
        if (roster.wr.some((p) => p.id === playerId)) return true;
        if (roster.bench.some((p) => p.id === playerId)) return true;
        return false;
    };

    const addPlayer = (player: Player): AddResult => {
        // Use the helper function to get base position
        const normalizedPos = getBasePosition(player.position);

        console.log(`Adding player: ${player.name}, Original position: ${player.position}, Normalized: ${normalizedPos}`);

        // prevent duplicates
        if (isPlayerInRoster(player.id)) {
            return { success: false, message: "Player already on roster" };
        }

        // helper to check bench space
        const benchHasSpace = (r: Roster) => r.bench.length < 4;

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
                if (next.rb.length < 2) {
                    next.rb.push(player);
                    result = { success: true, message: `Added to RB position (${next.rb.length}/2)` };
                    return next;
                }
                // position full -> bench if possible
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
                if (next.wr.length < 2) {
                    next.wr.push(player);
                    result = { success: true, message: `Added to WR position (${next.wr.length}/2)` };
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

            // TE logic -> treat TE as flex-first
            if (normalizedPos === "TE") {
                if (!next.flex) {
                    next.flex = player;
                    result = { success: true, message: "Added to FLEX position (TE)" };
                    return next;
                }
                // flex is occupied -> try move existing flex to bench then place TE
                if (benchHasSpace(next)) {
                    next.bench.push(next.flex as Player);
                    next.flex = player;
                    result = { success: true, message: "Existing FLEX moved to bench, TE added to FLEX" };
                    return next;
                }
                // flex occupied and bench full -> reject
                result = { success: false, message: "FLEX + bench full" };
                return prev;
            }

            // Handle K, DST, and other positions - go straight to bench
            if (normalizedPos === "K" || normalizedPos === "DST" || normalizedPos === "DEF") {
                if (benchHasSpace(next)) {
                    next.bench.push(player);
                    result = { success: true, message: `${normalizedPos} added to bench` };
                    return next;
                }
                result = { success: false, message: "Bench full - cannot add " + normalizedPos };
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
                flex: prev.flex && prev.flex.id === playerId ? null : prev.flex,
                bench: prev.bench.filter((p) => {
                    if (p.id === playerId) removed = true;
                    return p.id !== playerId;
                }),
            };
            // also check QB removal flag
            if (prev.qb?.id === playerId) removed = true;
            return next;
        });
        return removed;
    };

    const isPlayerDrafted = (playerId: string) => isPlayerInRoster(playerId);

    const getRosterStatus = () => ({
        qb: roster.qb ? 1 : 0,
        rb: roster.rb.length,
        wr: roster.wr.length,
        flex: roster.flex ? 1 : 0,
        bench: roster.bench.length,
    });

    const contextValue: RosterContextType = {
        roster,
        addPlayer,
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