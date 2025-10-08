import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    SafeAreaView,
    Animated,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    FlatList
} from 'react-native';
import {images} from "@/constants";
import PlayerCard from "@/components/PlayerCard";
import adp from "../../adp_halfPPR.json";
import { useDraft } from '@/contexts/DraftContext';
import adpPPR from "../../adp_fullPPR.json";

const players = adp.body.adpList;


const DraftScreen = () => {
    const { round, pick, timeLeft, setPick } = useDraft();
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
                    <Text className="text-white font-pingfang mr-6">0:23</Text>
                </View>
            </View>
            <Text className = "font-pingfang-bold text-red-400 ml-4">*Tap on any player for advanced Stats and AI insights</Text>

            {/* Player List */}
            <FlatList
                className="flex-1"
                data={players}
                keyExtractor={(item, index) => (item.playerID ? item.playerID.toString() : index.toString())}
                renderItem={({ item }) => (
                    <PlayerCard
                        PlayerName={item.longName}
                        PlayerPosition={item.posADP}
                        PlayerTeam={item.teamAbv ?? "Unknown"}
                    />
                )}
            />


        </View>
    );
};

export default DraftScreen;