import { Text, View , Image} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {images} from "@/constants";
import { router } from 'expo-router';
import MenuButton from '../components/MenuButton';

export default function Index() {
  return (
      <SafeAreaView className="flex-1 items-center justify-start bg-white pt-10 ">

              <Image
                  source={images.circleFootball}
                  className="w-40 h-40 " // 80px width/height, margin-top 20px
                  resizeMode="contain"
              />
              <Text className="text-xl font-pingfang-bold text-black pt-10">Dominate your league this year</Text>
                <Text className="text-xl font-pingfang-bold text-gray pt-1">Your perfect team awaits</Text>
      <View className = "self-start pl-5 pt-10">
          <Text className="text-xl  text-black pt-5 ">Quick Start</Text>
      </View>
       <View className = " items-center  bg-white pt-10 ">
           <MenuButton
               title="START SOLO DRAFT"

               onPress= {() => router.push('/setupScreen')}
           />
           <MenuButton
               title="JOIN ROOM"
               variant={"dark"}
               onPress= {() => {}}
           />

           <MenuButton
               title="TALK TO AI AGENT"
               onPress= {() => {}}
           />



       </View>
      </SafeAreaView>
  );
}
