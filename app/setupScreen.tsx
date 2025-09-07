import React, {useEffect, useState} from 'react';
import {View, Text, SafeAreaView, Animated, TextInput, TouchableOpacity} from 'react-native';
import ScrollView = Animated.ScrollView;
import { router } from 'expo-router';

const SetupScreen = () => {

    const [selectedTime, setSelectedTime] = useState(60);
    const timeOptions = [30, 45, 60, 75, 90, 120];
    const [selectedFormat, setSelectedFormat] = useState('Half PPR');
    const [DraftOrder, setDraftOrder] = useState('Snake');
    const [numberOfTeams, setNumberOfTeams] = useState('6');
    const [selectedPick, setSelectedPick] = useState(2);


    useEffect(() => {
        const teamCount = Math.min(parseInt(numberOfTeams) || 6, 14);
        if (selectedPick >= teamCount && teamCount > 0) {
            setSelectedPick(0); // Reset to first pick if current selection is out of range
        }
    }, [numberOfTeams, selectedPick]);


    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-8 pt-4">
                <Text className="text-center text-xl font-semibold mb-8">Setup</Text>
            </View>

            {/* Pick Timer Section */}
            <View className="mb-8">
                <Text className="text-lg font-semibold mb-4 ml-4">Pick Timer</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
                    {timeOptions.map((time) => (
                        <Text
                            key={time}
                            className={`px-4 py-2 mx-2 rounded ${selectedTime === time ? 'bg-blue-500 text-white' : 'bg-gray-100 text-black'}`}
                            onPress={() => setSelectedTime(time)}
                        >
                            {time}s
                        </Text>
                    ))}
                </ScrollView>
            </View>
            {/* Add this after the Pick Timer section */}
            <View className="mb-8">
                <Text className="text-lg font-semibold mx-4 mb-4">League Format</Text>
                <View className="flex-row justify-center space-x-4">
                    <Text
                        onPress={() => setSelectedFormat('Half PPR')}
                        className ={`px-6 py-3 ${selectedFormat === 'Half PPR' ? 'bg-blue-500 text-white' : 'bg-white text-black' }  rounded-full`}>Half PPR</Text>
                    <Text
                        onPress={() => setSelectedFormat('PPR')}
                        className ={`px-6 py-3 ${selectedFormat === 'PPR' ? 'bg-blue-500 text-white' : 'bg-white text-black' }  rounded-full`}> PPR</Text>

                </View>

            </View>
            <View className="mb-8">
                <Text className="text-lg font-semibold mx-4 mb-4">Draft Order</Text>
                <View className="flex-row justify-center space-x-4">
                    <Text
                        onPress={() => setDraftOrder('Snake')}
                        className ={`px-6 py-3 ${DraftOrder === 'Snake' ? 'bg-blue-500 text-white' : 'bg-white text-black' }  rounded-full`}>Snake</Text>
                    <Text
                        onPress={() => setDraftOrder('Linear')}
                        className ={`px-6 py-3 ${DraftOrder === 'Linear' ? 'bg-blue-500 text-white' : 'bg-white text-black' }  rounded-full`}> Linear</Text>

                </View>
            </View>
            <View className="mb-8">
                <Text className="text-lg font-semibold mx-4 mb-4">Number of Teams</Text>
                <TextInput
                    className="border border-gray-300 rounded-lg px-4 mx-8 py-3 text-base bg-white"
                    placeholder="Please Input"
                    placeholderTextColor="#9CA3AF"
                    value={numberOfTeams}
                    onChangeText={setNumberOfTeams}
                    keyboardType="numeric"
                    returnKeyType="done">

                </TextInput>
            </View>
           <View className="mb-8">
            <Text className="text-lg font-semibold mx-4 mb-4">Select Pick</Text>
            <View className="flex-row justify-between mx-2">
                {Array.from({ length: Math.min(parseInt(numberOfTeams) || 6, 14) || 6 },(_, index) => index).map((pickIndex) => (
                    <TouchableOpacity
                        key={pickIndex}
                        className={`w-6 h-6 rounded-full border-2 items-center justify-center${
                            selectedPick === pickIndex
                                ? 'border-green-500 bg-green-100'
                                : 'border-gray-300 bg-white'
                        }`}
                        onPress={() => setSelectedPick(pickIndex)}>

                    </TouchableOpacity>
                    )


                )}

            </View>

        </View>
            <TouchableOpacity
                className = "mx-auto my-16 py-6 bg-light rounded-md w-48"
                onPress={()=> router.push("/(draftTabs)/draftScreen")}
            >
                <Text className = "mx-auto font-pingfang-bold ">Start Drafting</Text>
            </TouchableOpacity>


        </SafeAreaView>
    );
};

export default SetupScreen;