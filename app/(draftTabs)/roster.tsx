import { Text, View, ScrollView, SafeAreaView } from "react-native";
import { Player, STARTER_ROSTER_SIZE, useRoster } from '@/contexts/RosterContext';
import { useDraft } from '@/contexts/DraftContext';

type PositionBadgeProps = {
    position: string;
};

type RosterPlayer = Player & {
    starred?: boolean;
};

type PlayerCardProps = {
    player?: RosterPlayer | null;
    position: string;
    isEmpty?: boolean;
};

type HeaderProps = {
    title: string;
};

type SectionHeaderProps = HeaderProps & {
    count: number;
    maxCount: number;
};

type StarterPosition = 'qb' | 'rb' | 'wr' | 'te' | 'flex' | 'dst' | 'k';

const PositionBadge = ({ position }: PositionBadgeProps) => {
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
            default:
                return position.startsWith("BEN")
                    ? `${baseStyle} bg-gray-500`
                    : `${baseStyle} bg-gray-600`;
        }
    };

    return (
        <View className={getPositionStyle()}>
            <Text className="text-white text-xs font-pingfang-bold">{position}</Text>
        </View>
    );
};

const PlayerCard = ({ player, position, isEmpty = false }: PlayerCardProps) => {
    if (isEmpty || !player) {
        return (
            <View className="flex-row items-center bg-gray-100 p-3 mb-2 rounded-lg border border-gray-200">
                <PositionBadge position={position} />
                <View className="ml-3 flex-1">
                    <Text className="text-gray-400 font-pingfang">Empty Slot</Text>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-row items-center bg-white p-3 mb-2 rounded-lg border border-gray-200 shadow-sm">
            <PositionBadge position={position} />
            <View className="ml-3 flex-1">
                <Text className="font-pingfang-bold text-gray-900 text-base">{player.name}</Text>
                <Text className="text-gray-600 text-sm font-pingfang">
                    {player.team} • {player.position} {player.round && player.pick ? `• R${player.round}P${player.pick}` : ''}
                </Text>
            </View>
            {player.starred && (
                <View className="ml-2">
                    <Text className="text-yellow-400 text-lg">★</Text>
                </View>
            )}
        </View>
    );
};

const PositionHeader = ({ title }: HeaderProps) => (
    <View className="mt-4 mb-2">
        <Text className="text-lg font-pingfang-bold text-gray-800 bg-gray-100 px-3 py-2 rounded">{title}</Text>
    </View>
);

const SectionHeader = ({ title, count, maxCount }: SectionHeaderProps) => (
    <View className="flex-row items-center mb-3 mt-6">
        <Text className="text-xl font-pingfang-bold text-gray-900">{title}</Text>
        <View className="ml-auto bg-gray-200 px-2 py-1 rounded">
            <Text className="text-gray-600 text-sm font-pingfang">{count}/{maxCount}</Text>
        </View>
    </View>
);

export default function Roster() {
    const { roster, rosterConfig } = useRoster();
    const { currentOverallPick, round } = useDraft();

    // Calculate starter count
    const starterPositions: StarterPosition[] = ['qb', 'rb', 'wr', 'te', 'flex', 'dst', 'k'];
    const starterCount = starterPositions.reduce((count, pos) => {
        if (pos === 'rb' || pos === 'wr') {
            return count + (roster[pos]?.length || 0);
        }
        return count + (roster[pos] ? 1 : 0);
    }, 0);

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView className="flex-1">
                {/* Header */}
                <View className="bg-white p-4 border-b border-gray-200">
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-2xl font-pingfang-bold text-gray-900">My Roster</Text>
                            <Text className="text-gray-600 font-pingfang">
                                Round {round} • {Math.max(currentOverallPick - 1, 0)} picks made
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="p-4 pb-20">
                    {/* Starters Section */}
                    <SectionHeader title="Starters" count={starterCount} maxCount={STARTER_ROSTER_SIZE} />

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
                    <SectionHeader title="Bench" count={roster.bench.length} maxCount={rosterConfig.bench} />

                    {Array.from({ length: rosterConfig.bench }, (_, index) => {
                        const player = roster.bench[index];

                        return (
                            <PlayerCard
                                key={player?.id ?? `empty-bench-${index + 1}`}
                                player={player}
                                position={`BEN${index + 1}`}
                                isEmpty={!player}
                            />
                        );
                    })}
                </View>
            </ScrollView>

        </SafeAreaView>
    );
}
