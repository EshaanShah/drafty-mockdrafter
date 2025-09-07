import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function DraftTabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#1E90FF",
                tabBarStyle: { backgroundColor: "#fff", borderTopWidth: 0 },
            }}
        >
            <Tabs.Screen
                name="draftScreen"
                options={{
                    title: "Draft",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="document-text" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="roster"
                options={{
                    title: "Roster",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="[name]"
                options={{
                    href: null, // This hides it from the tab bar
                }}
            />

        </Tabs>
    );
}
