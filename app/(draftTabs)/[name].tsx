import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import {images} from "@/constants";
import {RosterContext, useRoster} from '@/contexts/RosterContext'; // Import the roster context
import {
    generatePlayerAnalysis,
    type PlayerAnalysisResult,
    type PlayerAnalysisVerdict,
} from '@/services/aiService';
import { useDraft } from '@/contexts/DraftContext';
import adp from "../../adp_halfPPR.json";
import { getAvailablePlayersSnapshot, normalizePosition } from '@/utils/draftAi';

const players = adp.body.adpList;
const BOT_PICK_DELAY_MS = 850;

type AnalysisState =
    | { status: 'loading' }
    | { status: 'success'; result: PlayerAnalysisResult }
    | { status: 'drafted' }
    | { status: 'unavailable'; message: string };

const VERDICT_PRESENTATION: Record<PlayerAnalysisVerdict, { label: string; containerClass: string; textClass: string }> = {
    STEAL: { label: 'Steal', containerClass: 'bg-green-500', textClass: 'text-white' },
    'GOOD VALUE': { label: 'Good Value', containerClass: 'bg-green-500', textClass: 'text-white' },
    'FAIR VALUE': { label: 'Fair Value', containerClass: 'bg-amber-300', textClass: 'text-amber-950' },
    REACH: { label: 'Reach', containerClass: 'bg-red-500', textClass: 'text-white' },
};

export default function PlayerScreen() {
    const { id, name, posADP, overallADP, team } = useLocalSearchParams();
    const playerId = Array.isArray(id) ? id[0] : id;
    const playerName = Array.isArray(name) ? name[0] : name;
    const playerPosADP = Array.isArray(posADP) ? posADP[0] : posADP;
    const playerOverallADP = Array.isArray(overallADP) ? overallADP[0] : overallADP;
    const playerTeam = Array.isArray(team) ? team[0] : team;
    const normalizedPlayerPosition = useMemo(
        () => normalizePosition(playerPosADP),
        [playerPosADP]
    );
    const { roster } = useContext(RosterContext)!;
    const [analysisState, setAnalysisState] = useState<AnalysisState>({ status: 'loading' });
    const analysisRequestRef = useRef(0);

    // Get roster functions
    const { addPlayer } = useRoster();
    const {
        advancePick,
        recordDraftedPlayer,
        draftNextAvailablePlayer,
        currentOverallPick,
        round,
        pick,
        nextUserPick,
        picksUntilNextUserPick,
        teamOnClock,
        totalTeams,
        userPickNumber,
        draftOrder,
        leagueFormat,
        isUserTurn,
        isBotPickPending,
        isUserPickTimedOut,
        draftedPlayerIds,
    } = useDraft();

    const analysisKey = playerId ?? playerName ?? '';
    const analysisSnapshotRef = useRef<{
        key: string;
        playerData: Parameters<typeof generatePlayerAnalysis>[0];
        roster: typeof roster;
        isDraftedAtOpen: boolean;
    } | null>(null);

    if (!analysisSnapshotRef.current || analysisSnapshotRef.current.key !== analysisKey) {
        analysisSnapshotRef.current = {
            key: analysisKey,
            roster,
            isDraftedAtOpen: draftedPlayerIds.includes(analysisKey),
            playerData: {
                id: playerId ?? playerName ?? '',
                name: playerName ?? '',
                position: normalizedPlayerPosition.position,
                positionRank: normalizedPlayerPosition.positionRank,
                posADP: playerPosADP ?? '',
                overallADP: playerOverallADP ? Number(playerOverallADP) : undefined,
                team: playerTeam ?? '',
                currentOverallPick,
                round,
                pick,
                nextUserPick,
                picksUntilNextUserPick,
                teamOnClock,
                totalTeams,
                userPickNumber,
                draftOrder,
                leagueFormat,
                league: `${totalTeams}-team ${leagueFormat}`,
                draftedPlayerIds,
                availablePlayers: getAvailablePlayersSnapshot(players, draftedPlayerIds, 12),
            },
        };
    }

    useEffect(() => {
        if (!isBotPickPending) {
            return;
        }

        const botPickTimer = setTimeout(() => {
            draftNextAvailablePlayer(players);
        }, BOT_PICK_DELAY_MS);

        return () => {
            clearTimeout(botPickTimer);
        };
    }, [currentOverallPick, draftNextAvailablePlayer, isBotPickPending]);

    // Check if this player is already drafted
    const isDrafted = draftedPlayerIds.includes(playerId ?? playerName ?? '');

    // Generate AI analysis for the selected player and discard requests from older screens.
    useEffect(() => {
        const requestId = analysisRequestRef.current + 1;
        analysisRequestRef.current = requestId;
        const controller = new AbortController();

        const getAIAnalysis = async () => {
            const snapshot = analysisSnapshotRef.current;

            if (!snapshot || !snapshot.key) {
                setAnalysisState({ status: 'unavailable', message: 'AI analysis is unavailable for this player.' });
                return;
            }

            if (snapshot.isDraftedAtOpen || isDrafted) {
                setAnalysisState({ status: 'drafted' });
                return;
            }

            setAnalysisState({ status: 'loading' });

            try {
                const result = await generatePlayerAnalysis(snapshot.playerData, snapshot.roster, controller.signal);
                if (!controller.signal.aborted && analysisRequestRef.current === requestId) {
                    setAnalysisState({ status: 'success', result });
                }
            } catch (error) {
                if (!controller.signal.aborted && analysisRequestRef.current === requestId) {
                    console.error('AI analysis unavailable:', error);
                    setAnalysisState({
                        status: 'unavailable',
                        message: 'AI analysis is temporarily unavailable. You can still draft this player.',
                    });
                }
            }
        };

        getAIAnalysis();

        return () => {
            controller.abort();
        };
    }, [analysisKey, isDrafted]);

    // Handle draft button press
    const handleDraft = (e: any) => {
        e.stopPropagation(); // Prevent the card navigation when pressing draft

        if (!isUserTurn || isUserPickTimedOut) {
            Alert.alert('Bot Pick Pending', 'Please wait until your next pick.');
            return;
        }

            const player = {
                id: playerId ?? playerName ?? '',
                name: playerName ?? '',
                position: normalizedPlayerPosition.position,
                positionRank: normalizedPlayerPosition.positionRank,
                posADP: playerPosADP ?? '',
                overallADP: playerOverallADP ? Number(playerOverallADP) : undefined,
                team: playerTeam ?? '',
                round,
                pick,
        };

        const result = addPlayer(player);

        if (result.success) {
            recordDraftedPlayer(player.id);
            advancePick();
            Alert.alert('Success!', `${playerName} has been drafted!`);
        } else {
            Alert.alert('Cannot Draft', result.message || 'Unable to draft player');
        }
    };




    return (

        <View className="flex-1 bg-gray-50 bg-white">
            <View className="px-4 py-3 mt-12 mb-2 flex-row items-center justify-between border-b border-gray-200">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="p-1"
                >
                    <Text className="text-blue-500 text-lg">←</Text>
                </TouchableOpacity>

                <Text className="text-lg font-pingfang-bold text-black">INFO</Text>

                <TouchableOpacity className="p-1">
                    <Text className="text-gray-400 text-lg">⋯</Text>
                </TouchableOpacity>
                 </View>

            <ScrollView className="flex-1">
                <View className="mx-4 rounded-lg px-4 ">
                    <View className="flex-row items-center">
                        <View className="w-16 h-16 bg-gray-300 rounded-full mr-3 items-center justify-center">
                            <Text className="text-white font-bold text-xs">LOGO</Text>
                        </View>
                        {/* Player Info */}
                        <View className="flex-1">
                            <Text className="text-black text-xl font-pingfang-bold">
                                {playerName || "Player Name"}
                            </Text>
                            <Text className="text-gray-600 font-pingfang">
                                {playerPosADP || "QB"} – {playerTeam || "Team"}
                            </Text>
                            <Text className="text-gray-500 text-sm font-pingfang">
                                Age Unknown
                            </Text>
                        </View>
                    </View>
                </View>
                <View className="flex-1 justify-center items-center mt-5">
                    <View className="flex-1 bg-light rounded-lg p-4 w-96">
                        <Text className="font-pingfang-bold text-xl ">2024 Season Stats</Text>
                        <View className="flex-row justify-between mb-4 p-4 items-center ml-8 ">

                            <View className = "item-center flex-1">
                                <Text className="font-pingfang-bold text-lg ">15.1 </Text>
                                <Text>PPG</Text>

                            </View>

                            <View className = "item-center flex-1">
                                <Text className="font-pingfang-bold text-lg ">256.6 </Text>
                                <Text>PPG</Text>

                            </View>
                        </View>

                        <View className="flex-row justify-between mb-4 p-4 items-center ml-8 ">

                            <View className = "item-center flex-1">
                                <Text className="font-pingfang-bold text-lg ">17</Text>
                                <Text>Games Played</Text>

                            </View>

                            <View className = "item-center flex-1">
                                <Text className="font-pingfang-bold text-lg ">{playerOverallADP || "N/A"} </Text>
                                <Text>ADP</Text>

                            </View>
                        </View>

                    </View>
                    <View className = "flex-1 bg-white border-2 rounded-lg p-4 w-96 mt-8 border-light outline-offset-4">
                        <Text className = "font-pingfang-bold text-xl ">2025 Projections</Text>
                        <View className = "flex-row p-4 mx-4">
                            <View className = "flex-1">
                                <Text className = "font-pingfang-bold text-lg">15.1</Text>
                                <Text>PPG</Text>
                            </View>
                            <View className = "flex-1">
                                <Text className="font-pingfang-bold text-lg">256.6</Text>
                                <Text>Total Points</Text>

                            </View>
                        </View>
                    </View>
                </View>

                <View className="flex-1 justify-center items-center mt-8">
                    <View className="flex-1 bg-light rounded-lg p-4 w-96">
                        <View className="flex-row">
                            <Image
                                source = {images.robot}
                                className="mx-2"
                            />
                            <Text className=" ml-2 font-pingfang-bold text-xl ">AI Expert Summary</Text>
                        </View>
                        {analysisState.status === 'loading' && (
                            <View className="flex-row items-center p-4">
                                <ActivityIndicator color="#4b5563" />
                                <Text className="ml-3 font-pingfang text-gray-600">Analyzing this pick…</Text>
                            </View>
                        )}
                        {analysisState.status === 'success' && (
                            <Text className="p-4 font-pingfang">{analysisState.result.explanation}</Text>
                        )}
                        {analysisState.status === 'drafted' && (
                            <Text className="p-4 font-pingfang text-gray-600">
                                This player has already been drafted, so a pick verdict is no longer available.
                            </Text>
                        )}
                        {analysisState.status === 'unavailable' && (
                            <Text className="p-4 font-pingfang text-gray-600">{analysisState.message}</Text>
                        )}
                    </View>

                </View>

                {analysisState.status === 'success' && (() => {
                    const verdict = VERDICT_PRESENTATION[analysisState.result.verdict];
                    return (
                        <View className={`flex-1 justify-center rounded-xl items-center mt-8 mx-10 w-96 p-4 ${verdict.containerClass}`}>
                            <Text className={`text-xl font-pingfang-bold ${verdict.textClass}`}>{verdict.label}</Text>
                            <Text className={`mt-1 text-center font-pingfang ${verdict.textClass}`}>
                                Based on your roster, league settings, and the available board.
                            </Text>
                        </View>
                    );
                })()}
                <TouchableOpacity
                    className={`items-center justify-center mx-10 mb-7 w-96 mt-6 border-light p-6 border-2 ${
                        isDrafted || isBotPickPending || isUserPickTimedOut
                            ? 'bg-gray-300 border-gray-400'
                            : 'bg-light border-gray'
                    }`}
                    onPress={handleDraft}
                    disabled={isDrafted || isBotPickPending || isUserPickTimedOut}
                >
                    <Text className={`font-pingfang-bold ${
                        isDrafted || isBotPickPending || isUserPickTimedOut ? 'text-gray-500' : 'text-gray-800'
                    }`}>
                        {isDrafted ? 'Drafted' : isBotPickPending || isUserPickTimedOut ? 'Waiting' : 'Draft'}
                    </Text>
                </TouchableOpacity>



            </ScrollView>
            </View>
    )










}
