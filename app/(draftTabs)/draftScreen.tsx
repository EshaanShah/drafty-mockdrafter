import React, { useCallback, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    FlatList
} from 'react-native';
import {images} from "@/constants";
import PlayerCard from "@/components/PlayerCard";
import adp from "../../adp_halfPPR.json";
import { useDraft } from '@/contexts/DraftContext';
import { useFocusEffect } from '@react-navigation/native';

const players = adp.body.adpList;
const BOT_PICK_DELAY_MS = 850;

const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(seconds, 0);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const DraftScreen = () => {
    const {
        round,
        pick,
        timeLeft,
        isBotPickPending,
        startTimer,
        pauseTimer,
        tickTimer,
        draftNextAvailablePlayer,
        currentOverallPick,
        draftedPlayerIds,
    } = useDraft();

    useFocusEffect(
        useCallback(() => {
            startTimer();

            const timerId = setInterval(() => {
                tickTimer();
            }, 1000);

            return () => {
                clearInterval(timerId);
                pauseTimer();
            };
        }, [pauseTimer, startTimer, tickTimer])
    );

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

    return (
        <View className="flex-1 bg-white">
            {/* Header Section */}
            <View className="bg-black px-4 py-3 flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <Image
                        source={ images.football }
                        className="w-15 h-15 mr-8 mt-10 ml-0"
                    />
                    <Text className="text-white text-lg font-pingfang-bold">
                        Round: {round} Pick: {pick}
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <Image source={images.clock} className="w-4 h-4 border border-white rounded-full mr-4" />
                    <Text className="text-white font-pingfang mr-6">{formatTime(timeLeft)}</Text>
                </View>
            </View>
            <Text
                className={`px-4 py-2 font-pingfang-bold ${
                    isBotPickPending ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'
                }`}
            >
                {isBotPickPending ? 'Bot pick pending...' : "You're on the clock"}
            </Text>
            <Text className = "font-pingfang-bold text-red-400 ml-4">*Tap on any player for advanced Stats and AI insights</Text>

            {/* Player List */}
            <FlatList
                className="flex-1"
                data={players}
                extraData={draftedPlayerIds}
                keyExtractor={(item, index) => (item.playerID ? item.playerID.toString() : index.toString())}
                renderItem={({ item }) => (
                    <PlayerCard
                        PlayerId={item.playerID?.toString() ?? item.longName}
                        PlayerName={item.longName}
                        PlayerPosition={item.posADP}
                        PlayerTeam={item.teamAbv ?? "Unknown"}
                        OverallADP={item.overallADP}
                    />
                )}
            />


        </View>
    );
};

export default DraftScreen;
