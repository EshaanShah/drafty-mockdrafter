import { Text, View, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { RosterContext } from '@/contexts/RosterContext';
import { useContext, useState } from "react";

const PositionBadge = ({ position, variant = "default" }) => {
    const getPositionStyle = () => {
        const baseStyle = "px-2 py-1 rounded text-xs font-pingfang-bold text-white text-center min-w-12";

        switch (position) {
            case "QB":
            case "RB1":
            case "RB2":
            case "WR1":
            case "WR2":
            case "TE":
            case "FLEX":
            case "D/ST":
            case "K":
                return `${baseStyle} bg-gray-600`;
            case "BEN1":
            case "BEN2":
                return `${baseStyle} bg-gray-500`;
            default:
                return `${baseStyle} bg-gray-600`;
        }
    };

    return (
        <View className={getPositionStyle()}>
            <Text className="text-white text-xs font-pingfang-bold">{position}</Text>
        </View>
    );
};

const PlayerCard = ({ player, position, isEmpty = false }) => {
    if (isEmpty || !player) {
        return (
            <TouchableOpacity className="flex-row items-center bg-gray-100 p-3 mb-2 rounded-lg border border-gray-200">
                <PositionBadge position={position} />
                <View className="ml-3 flex-1">
                    <Text className="text-gray-400 font-pingfang">Empty Slot</Text>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity className="flex-row items-center bg-white p-3 mb-2 rounded-lg border border-gray-200 shadow-sm">
            <PositionBadge position={position} />
            <View className="ml-3 flex-1">
                <Text className="font-pingfang-bold text-gray-900 text-base">{player.name}</Text>
                <Text className="text-gray-600 text-sm font-pingfang">
                    {player.team} • {player.position} • R{player.round}P{player.pick}
                </Text>
            </View>
            {player.starred && (
                <View className="ml-2">
                    <Text className="text-yellow-400 text-lg">★</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const PositionHeader = ({ title }) => (
    <View className="mt-4 mb-2">
        <Text className="text-lg font-pingfang-bold text-gray-800 bg-gray-100 px-3 py-2 rounded">{title}</Text>
    </View>
);

const SectionHeader = ({ title, count, maxCount }) => (
    <View className="flex-row items-center mb-3 mt-6">
        <Text className="text-xl font-pingfang-bold text-gray-900">{title}</Text>
        <View className="ml-auto bg-gray-200 px-2 py-1 rounded">
            <Text className="text-gray-600 text-sm font-pingfang">{count}/{maxCount}</Text>
        </View>
    </View>
);

export default function Roster() {
    const { roster } = useContext(RosterContext)!;
    const [currentView, setCurrentView] = useState('roster'); // 'roster' or 'draft'

    // Calculate starter count
    const starterPositions = ['qb', 'rb', 'wr', 'te', 'flex', 'dst', 'k'];
    const starterCount = starterPositions.reduce((count, pos) => {
        if (pos === 'rb' || pos === 'wr') {
            return count + (roster[pos]?.length || 0);
        }
        return count + (roster[pos] ? 1 : 0);
    }, 0);

    if (currentView === 'draft') {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 justify-center items-center">
                    <Text className="text-xl font-pingfang-bold text-gray-900">Draft View</Text>
                    <Text className="text-gray-600 font-pingfang mt-2">Draft interface coming soon...</Text>
                </View>

                {/* Bottom Navigation */}
                <View className="bg-white border-t border-gray-200 px-4 py-2 flex-row">
                    <TouchableOpacity
                        className={`flex-1 py-3 rounded-lg mr-2 ${currentView === 'draft' ? 'bg-blue-500' : 'bg-gray-100'}`}
                        onPress={() => setCurrentView('draft')}
                    >
                        <Text className={`text-center font-pingfang-bold ${currentView === 'draft' ? 'text-white' : 'text-gray-700'}`}>
                            Draft
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 py-3 rounded-lg ml-2 ${currentView === 'roster' ? 'bg-blue-500' : 'bg-gray-100'}`}
                        onPress={() => setCurrentView('roster')}
                    >
                        <Text className={`text-center font-pingfang-bold ${currentView === 'roster' ? 'text-white' : 'text-gray-700'}`}>
                            Roster
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView className="flex-1">
                {/* Header */}
                <View className="bg-white p-4 border-b border-gray-200">
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-2xl font-pingfang-bold text-gray-900">My Roster</Text>
                            <Text className="text-gray-600 font-pingfang">Round 8 • 15 picks made</Text>
                        </View>
                        <TouchableOpacity className="bg-gray-100 px-3 py-1 rounded flex-row items-center">
                            <Text className="text-gray-700 mr-1">📊</Text>
                            <Text className="text-gray-700 font-pingfang">Summary</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="p-4 pb-20">
                    {/* Starters Section */}
                    <SectionHeader title="Starters" count={starterCount} maxCount={9} />

                    {/* QB Section */}
                    <PositionHeader title="QUARTERBACK" />
                    <PlayerCard
                        player={roster.qb}
                        position="QB"
                        isEmpty={!roster.qb}
                    />

                    {/* RB Section */}
                    <PositionHeader title="RUNNING BACKS" />
                    <PlayerCard
                        player={roster.rb?.[0]}
                        position="RB1"
                        isEmpty={!roster.rb?.[0]}
                    />
                    <PlayerCard
                        player={roster.rb?.[1]}
                        position="RB2"
                        isEmpty={!roster.rb?.[1]}
                    />

                    {/* WR Section */}
                    <PositionHeader title="WIDE RECEIVERS" />
                    <PlayerCard
                        player={roster.wr?.[0]}
                        position="WR1"
                        isEmpty={!roster.wr?.[0]}
                    />
                    <PlayerCard
                        player={roster.wr?.[1]}
                        position="WR2"
                        isEmpty={!roster.wr?.[1]}
                    />

                    {/* TE Section */}
                    <PositionHeader title="TIGHT END" />
                    <PlayerCard
                        player={roster.te}
                        position="TE"
                        isEmpty={!roster.te}
                    />

                    {/* FLEX Section */}
                    <PositionHeader title="FLEX" />
                    <PlayerCard
                        player={roster.flex}
                        position="FLEX"
                        isEmpty={!roster.flex}
                    />

                    {/* D/ST Section */}
                    <PositionHeader title="DEFENSE/SPECIAL TEAMS" />
                    <PlayerCard
                        player={roster.dst}
                        position="D/ST"
                        isEmpty={!roster.dst}
                    />

                    {/* Kicker Section */}
                    <PositionHeader title="KICKER" />
                    <PlayerCard
                        player={roster.k}
                        position="K"
                        isEmpty={!roster.k}
                    />

                    {/* Bench Section */}
                    <SectionHeader title="Bench" count={roster.bench?.length || 0} maxCount={6} />

                    {roster.bench?.map((player, index) => (
                        <PlayerCard
                            key={index}
                            player={player}
                            position={`BEN${index + 1}`}
                        />
                    )) || (
                        <>
                            <PlayerCard position="BEN1" isEmpty={true} />
                            <PlayerCard position="BEN2" isEmpty={true} />
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <View className="bg-white border-t border-gray-200 px-4 py-2 flex-row">
                <TouchableOpacity
                    className={`flex-1 py-3 rounded-lg mr-2 ${currentView === 'draft' ? 'bg-blue-500' : 'bg-gray-100'}`}
                    onPress={() => setCurrentView('draft')}
                >
                    <Text className={`text-center font-pingfang-bold ${currentView === 'draft' ? 'text-white' : 'text-gray-700'}`}>
                        Draft
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 py-3 rounded-lg ml-2 ${currentView === 'roster' ? 'bg-blue-500' : 'bg-gray-100'}`}
                    onPress={() => setCurrentView('roster')}
                >
                    <Text className={`text-center font-pingfang-bold ${currentView === 'roster' ? 'text-white' : 'text-gray-700'}`}>
                        Roster
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}