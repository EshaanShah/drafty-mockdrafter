import { Text, View, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "@/constants";
import { router } from "expo-router";
import MenuButton from "../components/MenuButton";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export default function Home() {
    const { isAuthenticated, isAuthReady, signOut } = useAuth();

    useEffect(() => {
        if (isAuthReady && !isAuthenticated) {
            router.replace("/");
        }
    }, [isAuthReady, isAuthenticated]);

    const handleSignOut = () => {
        signOut();
        router.replace("/");
    };

    return (
        <SafeAreaView className="flex-1 items-center justify-start bg-white pt-2">
            <View className="w-full items-end px-5">
                <TouchableOpacity className="rounded-full bg-black px-5 py-2" onPress={handleSignOut}>
                    <Text className="font-pingfang-bold text-white">Log out</Text>
                </TouchableOpacity>
            </View>

            <Image
                source={images.circleFootball}
                className="h-40 w-40"
                resizeMode="contain"
            />
            <Text className="pt-10 text-xl font-pingfang-bold text-black">Dominate your league this year</Text>
            <Text className="pt-1 text-xl font-pingfang-bold text-gray">Your perfect team awaits</Text>
            <View className="self-start pl-5 pt-10">
                <Text className="pt-5 text-xl text-black">Quick Start</Text>
            </View>
            <View className="items-center bg-white pt-10">
                <MenuButton
                    title="START SOLO DRAFT"
                    onPress={() => router.push("/setupScreen")}
                />
                <MenuButton
                    title="JOIN ROOM"
                    variant="dark"
                    onPress={() => {}}
                />

                <MenuButton
                    title="TALK TO AI AGENT"
                    onPress={() => {}}
                />
            </View>
        </SafeAreaView>
    );
}
