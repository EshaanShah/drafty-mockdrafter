import './globals.css';
import {Text} from "react-native";
import { Stack } from "expo-router";
import {useFonts} from 'expo-font';
import {useEffect} from 'react';


export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Quicksand-Regular": require("../assets/fonts/Quicksand-Regular.ttf"),
    "Quicksand-Bold": require("../assets/fonts/Quicksand-Bold.ttf"),
    "Quicksand-Medium": require("../assets/fonts/Quicksand-Medium.ttf"),
    "Quicksand-SemiBold": require("../assets/fonts/Quicksand-SemiBold.ttf"),
    "Quicksand-Light": require("../assets/fonts/Quicksand-Light.ttf"),
    "PingFangSC-Regular": require("../assets/fonts/pingfang-sc-regular.ttf"),
    "PingFangSC-Bold": require("../assets/fonts/pingfang-sc-bold.ttf"),
  });

  // Prevent rendering until fonts are loaded
  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }

  return <Stack screenOptions={{headerShown: false}}/>;
}
