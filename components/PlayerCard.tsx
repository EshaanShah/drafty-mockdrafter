import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';   // ✅ use the hook
import { useRoster } from '@/contexts/RosterContext'; // Import the roster context
import {useDraft} from '@/contexts/DraftContext'
interface PlayerCardProps {
    PlayerName: string;
    PlayerPosition: string;
    PlayerTeam: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ PlayerName, PlayerPosition, PlayerTeam }) => {
    const router = useRouter();
    const { addPlayer, isPlayerDrafted } = useRoster();
    const draft =useDraft();

    // Check if this player is already drafted
    const isDrafted = isPlayerDrafted(PlayerName); // Using name as ID for simplicity

    // Handle draft button press
    const handleDraft = (e: any) => {
        e.stopPropagation(); // Prevent the card navigation when pressing draft

        // Create player object
        const player = {
            id: PlayerName, // Using name as ID (you might want to use a real ID later)
            name: PlayerName,
            position: PlayerPosition,
            team: PlayerTeam
        };

        // Try to add player to roster
        const result = addPlayer(player);

        if (result.success) {

            Alert.alert('Success!', `${PlayerName} has been drafted!`);

        } else {
            Alert.alert('Cannot Draft', result.message || 'Unable to draft player');
        }
    };

    return (
        <TouchableOpacity
            className={`mx-2 my-1 rounded-lg ${isDrafted ? 'bg-gray-200' : 'bg-white'}`} // Gray out if drafted
            onPress={() =>
                router.push({
                    pathname: "/(draftTabs)/[name]",
                    params: {
                        name: PlayerName,
                        position: PlayerPosition,
                        team: PlayerTeam || "",
                    },
                })
            }
        >
            {/* Main container with side-by-side layout */}
            <View className="px-4 py-4 flex-row justify-between items-center border-b">
                {/* LEFT SIDE - Player Information */}
                <View className="flex-1">
                    {/* Player Name */}
                    <Text className={`text-lg font-pingfang-bold mb-1 ${isDrafted ? 'text-gray-500' : 'text-black'}`}>
                        {PlayerName} {isDrafted ? '(DRAFTED)' : ''}
                    </Text>
                    {/* Position and Team */}
                    <Text className="text-gray font-pingfang mb-3">
                        {PlayerPosition} – {PlayerTeam}
                    </Text>
                </View>

                {/* RIGHT SIDE - Draft Button */}
                <TouchableOpacity
                    className={`border rounded-md px-4 py-2 ml-4 ${
                        isDrafted
                            ? 'bg-gray-300 border-gray-400'
                            : 'bg-light border-gray'
                    }`}
                    onPress={handleDraft}
                    disabled={isDrafted} // Disable if already drafted
                >
                    <Text className={`font-pingfang-bold ${
                        isDrafted ? 'text-gray-500' : 'text-gray-800'
                    }`}>
                        {isDrafted ? 'Drafted' : 'Draft'}
                    </Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

export default PlayerCard;