import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDraft } from "@/contexts/DraftContext";
import { Player, useRoster } from "@/contexts/RosterContext";

type ResultSlot = {
    label: string;
    player?: Player | null;
};

const ResultPlayer = ({ label, player }: ResultSlot) => (
    <View className="mb-2 flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3">
        <View className="w-14 rounded-md bg-gray-700 px-2 py-1">
            <Text className="text-center text-xs font-pingfang-bold text-white">{label}</Text>
        </View>
        <View className="ml-3 flex-1">
            <Text className={`font-pingfang-bold ${player ? "text-gray-900" : "text-gray-400"}`}>
                {player?.name ?? "Empty Slot"}
            </Text>
            {player ? (
                <Text className="mt-1 text-xs font-pingfang text-gray-500">
                    {[player.team, player.position, player.round ? `Round ${player.round}` : undefined]
                        .filter(Boolean)
                        .join(" • ")}
                </Text>
            ) : null}
        </View>
    </View>
);

export default function DraftResultsScreen() {
    const {
        draftOrder,
        leagueFormat,
        resetDraft,
        totalPicks,
        totalRounds,
        totalTeams,
        userPickNumber,
    } = useDraft();
    const { roster, rosterConfig, rosterSize } = useRoster();

    const slots: ResultSlot[] = [
        { label: "QB", player: roster.qb },
        { label: "RB1", player: roster.rb[0] },
        { label: "RB2", player: roster.rb[1] },
        { label: "WR1", player: roster.wr[0] },
        { label: "WR2", player: roster.wr[1] },
        { label: "TE", player: roster.te },
        { label: "FLEX", player: roster.flex },
        { label: "D/ST", player: roster.dst },
        { label: "K", player: roster.k },
        ...Array.from({ length: rosterConfig.bench }, (_, index) => ({
            label: `BEN${index + 1}`,
            player: roster.bench[index],
        })),
    ];
    const filledSlots = slots.filter(({ player }) => Boolean(player)).length;

    const handleNewDraft = () => {
        resetDraft();
        router.replace("/setupScreen");
    };

    const handleHome = () => {
        resetDraft();
        router.replace("/home");
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView contentContainerClassName="px-5 pb-10 pt-6">
                <View className="items-center">
                    <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <Text className="text-3xl text-green-700">✓</Text>
                    </View>
                    <Text className="text-3xl font-pingfang-bold text-gray-950">Draft Complete</Text>
                    <Text className="mt-2 text-center font-pingfang text-gray-600">
                        Your {totalRounds}-round mock draft is in the books.
                    </Text>
                </View>

                <View className="mt-7 rounded-2xl bg-black px-5 py-5">
                    <Text className="text-lg font-pingfang-bold text-white">Draft Summary</Text>
                    <View className="mt-4 flex-row flex-wrap">
                        <View className="mb-4 w-1/2">
                            <Text className="text-xs font-pingfang text-gray-400">LEAGUE</Text>
                            <Text className="mt-1 font-pingfang-bold text-white">{totalTeams} teams</Text>
                        </View>
                        <View className="mb-4 w-1/2">
                            <Text className="text-xs font-pingfang text-gray-400">YOUR POSITION</Text>
                            <Text className="mt-1 font-pingfang-bold text-white">Pick {userPickNumber}</Text>
                        </View>
                        <View className="w-1/2">
                            <Text className="text-xs font-pingfang text-gray-400">FORMAT</Text>
                            <Text className="mt-1 font-pingfang-bold text-white">{leagueFormat}</Text>
                        </View>
                        <View className="w-1/2">
                            <Text className="text-xs font-pingfang text-gray-400">ORDER</Text>
                            <Text className="mt-1 font-pingfang-bold text-white">{draftOrder}</Text>
                        </View>
                    </View>
                    <Text className="mt-4 border-t border-gray-700 pt-4 text-sm font-pingfang text-gray-300">
                        {totalPicks} total picks • {filledSlots}/{rosterSize} roster spots filled
                    </Text>
                </View>

                {/* Future end-of-draft grade summary can be inserted here. */}

                <View className="mb-3 mt-8 flex-row items-center justify-between">
                    <Text className="text-xl font-pingfang-bold text-gray-900">Your Roster</Text>
                    <Text className="font-pingfang text-gray-500">{filledSlots}/{rosterSize}</Text>
                </View>
                {slots.map((slot) => (
                    <ResultPlayer key={slot.label} {...slot} />
                ))}

                <TouchableOpacity
                    className="mt-7 items-center rounded-xl bg-blue-500 px-5 py-4"
                    onPress={handleNewDraft}
                >
                    <Text className="font-pingfang-bold text-white">New Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className="mt-3 items-center rounded-xl border border-gray-300 bg-white px-5 py-4"
                    onPress={handleHome}
                >
                    <Text className="font-pingfang-bold text-gray-800">Home</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
