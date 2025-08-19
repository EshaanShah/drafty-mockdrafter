import { Text, View } from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";

export default function Index() {
  return (
      <SafeAreaView className="flex-1 items-center justify-start bg-white ">
          <Text className="text-xl font-pingfang-sc text-black ">
              QUICK START
          </Text>
      </SafeAreaView>
  );
}
