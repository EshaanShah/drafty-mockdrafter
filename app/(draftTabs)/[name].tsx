import React, {useContext, useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, Image, ScrollView, Alert} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import {images} from "@/constants";
import {RosterContext, useRoster} from '@/contexts/RosterContext'; // Import the roster context
import { generatePlayerAnalysis } from '@/services/aiService'; // Import your API function
import { useDraft } from '@/contexts/DraftContext';


export default function PlayerScreen() {
    const { name, position, team } = useLocalSearchParams();
    const playerName = Array.isArray(name) ? name[0] : name;
    const playerPosition = Array.isArray(position) ? position[0] : position;
    const playerTeam = Array.isArray(team) ? team[0] : team;
    const { roster } = useContext(RosterContext)!;
    const [reachStatus, setStatus] = useState('reach');
    const [aiAnalysis, setAiAnalysis] = useState('Loading AI analysis...'); // New state for AI analysis

    // Get roster functions
    const { addPlayer, isPlayerDrafted } = useRoster();
    const { advancePick, round, pick, totalTeams, leagueFormat, isUserTurn, isBotPickPending } = useDraft();

    // Generate AI analysis when component mounts
    useEffect(() => {
        const getAIAnalysis = async () => {
            const playerData = {
                name: playerName ?? '',
                position: playerPosition ?? '',
                team: playerTeam ?? '',
                round,
                pick,
                league: `${totalTeams}-team ${leagueFormat}`
            };

            try {
                const analysis = await generatePlayerAnalysis(playerData, roster);
                setAiAnalysis(analysis);

                // You can also set the reach status based on the analysis
                if (analysis.includes("Good Value")) {
                    setStatus('goodValue');
                } else if (analysis.includes("Fair Value")) {
                    setStatus('fairValue');
                } else {
                    setStatus('reach');
                }
            } catch {
                setAiAnalysis("Unable to generate analysis. Please try again later.");
            }
        };

        getAIAnalysis();
    }, [leagueFormat, pick, playerName, playerPosition, playerTeam, roster, round, totalTeams]); // Re-run if any of these change

    // Check if this player is already drafted
    const isDrafted = isPlayerDrafted(playerName ?? ''); // Using name as ID for simplicity

    // Handle draft button press
    const handleDraft = (e: any) => {
        e.stopPropagation(); // Prevent the card navigation when pressing draft

        if (!isUserTurn) {
            Alert.alert('Bot Pick Pending', 'Please wait until your next pick.');
            return;
        }

        const player = {
            id: playerName ?? '', // Using name as ID (you might want to use a real ID later)
            name: playerName ?? '',
            position: playerPosition ?? '',
            team: playerTeam ?? '',
            round,
            pick,
        };

        const result = addPlayer(player);

        if (result.success) {
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
                                {playerPosition || "QB"} – {playerTeam || "Team"}
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
                                <Text className="font-pingfang-bold text-lg ">183 </Text>
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
                        <Text className= 'p-4 font-pingfang'>
                            {aiAnalysis}
                        </Text>
                    </View>

                </View>

                <View className ={`flex-1 justify-center rounded-xl items-center mt-8 mx-10 w-96 p-4 ${reachStatus === 'reach' ? 'bg-red-300 text-white' : reachStatus === 'goodValue' ? 'bg-green-500 text-white'  : 'bg-white text-black'}  `}  >
                    <Text className="text-lg font-pingfang-bold">Reach pick based on your roster, league settings, and who is on the board  </Text>
                </View>
                <TouchableOpacity
                    className={`items-center justify-center mx-10 mb-7 w-96 mt-6 border-light p-6 border-2 ${
                        isDrafted || isBotPickPending
                            ? 'bg-gray-300 border-gray-400'
                            : 'bg-light border-gray'
                    }`}
                    onPress={handleDraft}
                    disabled={isDrafted || isBotPickPending} // Disable if already drafted or a bot placeholder pick is active
                >
                    <Text className={`font-pingfang-bold ${
                        isDrafted || isBotPickPending ? 'text-gray-500' : 'text-gray-800'
                    }`}>
                        {isDrafted ? 'Drafted' : isBotPickPending ? 'Waiting' : 'Draft'}
                    </Text>
                </TouchableOpacity>



            </ScrollView>
            </View>
    )










}
