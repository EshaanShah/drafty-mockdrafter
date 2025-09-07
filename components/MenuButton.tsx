import {View, Text, TouchableOpacity} from 'react-native'
import React from 'react'
interface MenuButtonProps {
    title: string;
    variant?: 'light' | 'dark';
    onPress?: () => void;

}
const MenuButton: React.FC<MenuButtonProps> = ({title,onPress, variant = 'light'}) => {
    return (
        <TouchableOpacity className = {`${variant === 'dark' ? 'bg-gray' : 'bg-light'} rounded-xl py-12 px-24 mx-0.5 mb-6 self-stretch`}
            onPress = {onPress}
        >
            <Text className ={`${variant === 'dark' ? 'text-white' : 'text-black'} text-center font-pingfang-bold text-lg`}>{title}</Text>

        </TouchableOpacity>
    )
}
export default MenuButton
