import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { images } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";

type AuthScreenMode = "login" | "signup" | "confirm" | "forgot" | "reset";

const draftBoardRows = [
    ["bg-orange-600", "bg-[#d7b98a]", "bg-[#1f2a24]", "bg-[#2f4d1f]", "bg-[#1f2a24]"],
    ["bg-[#1f2a24]", "bg-[#1f2a24]", "bg-[#e9d1a7]", "bg-[#1f2a24]", "bg-orange-600"],
    ["bg-[#6f8635]", "bg-[#1f2a24]", "bg-[#1f2a24]", "bg-[#d7b98a]", "bg-[#1f2a24]"],
];

const getTitle = (mode: AuthScreenMode) => {
    switch (mode) {
        case "signup":
            return "Join Drafty";
        case "confirm":
            return "Confirm email";
        case "forgot":
            return "Reset password";
        case "reset":
            return "New password";
        default:
            return "Log in";
    }
};

const getPrimaryLabel = (mode: AuthScreenMode) => {
    switch (mode) {
        case "signup":
            return "Create account";
        case "confirm":
            return "Confirm and continue";
        case "forgot":
            return "Send reset code";
        case "reset":
            return "Update password";
        default:
            return "Continue";
    }
};

export default function LoginScreen() {
    const {
        isAuthenticated,
        isAuthReady,
        signIn,
        signUp,
        confirmSignUp,
        resendSignUpCode,
        resetPassword,
        confirmResetPassword,
    } = useAuth();
    const [mode, setMode] = useState<AuthScreenMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [preferredUsername, setPreferredUsername] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [confirmationCode, setConfirmationCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [statusMessage, setStatusMessage] = useState("");

    useEffect(() => {
        if (isAuthReady && isAuthenticated) {
            router.replace("/home");
        }
    }, [isAuthReady, isAuthenticated]);

    const showPasswordInput = mode === "login" || mode === "signup" || mode === "reset";
    const showCodeInput = mode === "confirm" || mode === "reset";
    const helperText = useMemo(() => {
        if (mode === "signup") {
            return "Add your username and birthdate, then use a strong password.";
        }

        if (mode === "confirm") {
            return "Enter the verification code Cognito sent to your email.";
        }

        if (mode === "forgot") {
            return "We will send a reset code to your verified email.";
        }

        if (mode === "reset") {
            return "Enter your reset code and choose a new password.";
        }

        return "Log in with your verified Drafty account.";
    }, [mode]);

    const switchMode = (nextMode: AuthScreenMode) => {
        setMode(nextMode);
        setErrorMessage("");
        setStatusMessage("");
        setConfirmationCode("");
    };

    const handleSubmit = async () => {
        if (isSubmitting) {
            return;
        }

        setErrorMessage("");
        setStatusMessage("");
        setIsSubmitting(true);

        const result = await (async () => {
            if (mode === "signup") {
                return signUp(email, password, {
                    birthdate,
                    preferredUsername,
                });
            }

            if (mode === "confirm") {
                return confirmSignUp(email, confirmationCode);
            }

            if (mode === "forgot") {
                return resetPassword(email);
            }

            if (mode === "reset") {
                return confirmResetPassword(email, confirmationCode, password);
            }

            return signIn(email, password);
        })();

        setIsSubmitting(false);

        if (!result.success) {
            setErrorMessage(result.message || "Unable to complete auth request right now.");

            if (result.nextStep === "CONFIRM_SIGN_UP") {
                setMode("confirm");
            }

            if (result.nextStep === "RESET_PASSWORD") {
                setMode("forgot");
            }

            return;
        }

        if (mode === "signup") {
            setStatusMessage(result.message || "Check your email for the confirmation code.");
            setMode("confirm");
            return;
        }

        if (mode === "forgot") {
            setStatusMessage(result.message || "Check your email for the reset code.");
            setMode("reset");
            return;
        }

        if (mode === "reset") {
            setStatusMessage(result.message || "Password reset. You can log in now.");
            setPassword("");
            setConfirmationCode("");
            setMode("login");
            return;
        }

        if (mode === "confirm" && result.message) {
            setStatusMessage(result.message);
            setPassword("");
            setConfirmationCode("");
            setMode("login");
            return;
        }

        router.replace("/home");
    };

    const handleResendCode = async () => {
        if (isSubmitting) {
            return;
        }

        setErrorMessage("");
        setStatusMessage("");
        setIsSubmitting(true);
        const result = await resendSignUpCode(email);
        setIsSubmitting(false);

        if (!result.success) {
            setErrorMessage(result.message || "Unable to resend the code.");
            return;
        }

        setStatusMessage(result.message || "A new confirmation code was sent.");
    };

    if (!isAuthReady) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-[#f5ead8]">
                <ActivityIndicator color="#07111c" />
                <Text className="mt-4 font-pingfang-bold text-[#07111c]">Checking your session...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#f5ead8]">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    contentContainerClassName="pb-12"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="relative min-h-screen overflow-hidden px-5 pt-8">
                        <View className="absolute -left-20 top-16 h-48 w-48 rounded-full bg-white/50" />
                        <View className="absolute -right-24 top-8 h-64 w-64 rounded-full bg-white/40" />
                        <View className="items-center pt-4">
                            <Image
                                source={images.football}
                                className="h-16 w-20 rotate-12"
                                resizeMode="contain"
                            />
                            <Text className="mt-2 text-center text-5xl font-pingfang-bold italic tracking-tighter text-[#06111b]">
                                Drafty
                            </Text>
                            <View className="mt-3 h-1 w-24 rounded-full bg-orange-600" />
                            <Text className="mt-5 text-center text-xs font-pingfang-bold uppercase tracking-[3px] text-[#111827]">
                                Draft. Strategize. Win.
                            </Text>
                            <Text className="mt-2 text-center text-xs font-pingfang-bold uppercase tracking-[2px] text-[#6b6257]">
                                Your fantasy season starts here.
                            </Text>
                        </View>

                        <View className="mt-9 overflow-hidden rounded-[26px] border border-[#2b261f] bg-[#08111a] px-3 pb-4 pt-3">
                            <View className="mb-3 flex-row justify-between px-1">
                                {["RD 1", "RD 2", "RD 3", "RD 4", "RD 5"].map((round) => (
                                    <Text key={round} className="text-[10px] font-pingfang-bold text-[#f0d5aa]">
                                        {round}
                                    </Text>
                                ))}
                            </View>
                            {draftBoardRows.map((row, rowIndex) => (
                                <View key={rowIndex} className="mb-3 flex-row items-center">
                                    <Text className="mr-2 w-5 text-[10px] font-pingfang-bold text-[#f0d5aa]">
                                        0{rowIndex + 1}
                                    </Text>
                                    {row.map((color, colIndex) => (
                                        <View
                                            key={`${rowIndex}-${colIndex}`}
                                            className={`mr-2 h-5 flex-1 rounded ${color}`}
                                        />
                                    ))}
                                </View>
                            ))}
                            <View className="mt-3 h-8 overflow-hidden rounded-b-[22px] bg-[#31451f]">
                                <View className="mt-3 h-px bg-white/50" />
                                <View className="mt-2 h-px bg-white/40" />
                            </View>
                        </View>

                        <View className="mt-8 rounded-[30px] border border-white/80 bg-white px-5 pb-7 pt-7 shadow-sm">
                            <View className="mb-3 flex-row items-center justify-center">
                                <View className="mr-5 h-1 w-8 rounded-full bg-orange-600" />
                                <Text className="text-center text-3xl font-pingfang-bold text-[#07111c]">
                                    {getTitle(mode)}
                                </Text>
                                <View className="ml-5 h-1 w-8 rounded-full bg-orange-600" />
                            </View>
                            <Text className="mb-6 text-center text-sm font-pingfang text-[#6b6257]">
                                {helperText}
                            </Text>

                            <View className="rounded-2xl border border-[#ddd4c7] bg-[#fffdfa] px-4 py-4">
                                <View className="flex-row items-center">
                                    <Image source={images.envelope} className="mr-3 h-5 w-5 opacity-70" resizeMode="contain" />
                                    <TextInput
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        className="flex-1 text-base font-pingfang text-[#07111c]"
                                        keyboardType="email-address"
                                        onChangeText={setEmail}
                                        placeholder="Email"
                                        placeholderTextColor="#8d867c"
                                        textContentType="emailAddress"
                                        value={email}
                                    />
                                </View>
                            </View>

                            {mode === "signup" ? (
                                <>
                                    <View className="mt-4 rounded-2xl border border-[#ddd4c7] bg-[#fffdfa] px-4 py-4">
                                        <View className="flex-row items-center">
                                            <Text className="mr-3 text-xs font-pingfang-bold text-[#6b6257]">USER</Text>
                                            <TextInput
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                className="flex-1 text-base font-pingfang text-[#07111c]"
                                                onChangeText={setPreferredUsername}
                                                placeholder="Username"
                                                placeholderTextColor="#8d867c"
                                                textContentType="username"
                                                value={preferredUsername}
                                            />
                                        </View>
                                    </View>

                                    <View className="mt-4 rounded-2xl border border-[#ddd4c7] bg-[#fffdfa] px-4 py-4">
                                        <View className="flex-row items-center">
                                            <Text className="mr-3 text-xs font-pingfang-bold text-[#6b6257]">DOB</Text>
                                            <TextInput
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                className="flex-1 text-base font-pingfang text-[#07111c]"
                                                keyboardType="numbers-and-punctuation"
                                                onChangeText={setBirthdate}
                                                placeholder="Birthdate YYYY-MM-DD"
                                                placeholderTextColor="#8d867c"
                                                textContentType="birthdate"
                                                value={birthdate}
                                            />
                                        </View>
                                    </View>
                                </>
                            ) : null}

                            {showCodeInput ? (
                                <View className="mt-4 rounded-2xl border border-[#ddd4c7] bg-[#fffdfa] px-4 py-4">
                                    <View className="flex-row items-center">
                                        <Text className="mr-3 text-xs font-pingfang-bold text-[#6b6257]">CODE</Text>
                                        <TextInput
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            className="flex-1 text-base font-pingfang text-[#07111c]"
                                            keyboardType="number-pad"
                                            onChangeText={setConfirmationCode}
                                            placeholder="Confirmation code"
                                            placeholderTextColor="#8d867c"
                                            value={confirmationCode}
                                        />
                                    </View>
                                </View>
                            ) : null}

                            {showPasswordInput ? (
                                <View className="mt-4 rounded-2xl border border-[#ddd4c7] bg-[#fffdfa] px-4 py-4">
                                    <View className="flex-row items-center">
                                        <Text className="mr-3 text-xs font-pingfang-bold text-[#6b6257]">LOCK</Text>
                                        <TextInput
                                            className="flex-1 text-base font-pingfang text-[#07111c]"
                                            onChangeText={setPassword}
                                            placeholder={mode === "reset" ? "New password" : "Password"}
                                            placeholderTextColor="#8d867c"
                                            secureTextEntry
                                            textContentType={mode === "signup" || mode === "reset" ? "newPassword" : "password"}
                                            value={password}
                                        />
                                    </View>
                                </View>
                            ) : null}

                            {errorMessage ? (
                                <Text className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-pingfang-bold text-red-500">
                                    {errorMessage}
                                </Text>
                            ) : null}

                            {statusMessage ? (
                                <Text className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-pingfang-bold text-green-700">
                                    {statusMessage}
                                </Text>
                            ) : null}

                            <TouchableOpacity
                                activeOpacity={0.86}
                                className={`mt-6 rounded-2xl py-4 ${isSubmitting ? "bg-gray-500" : "bg-black"}`}
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <View className="flex-row items-center justify-center">
                                        <Text className="text-center text-base font-pingfang-bold text-white">
                                            {getPrimaryLabel(mode)}
                                        </Text>
                                        <Text className="ml-3 text-xl text-white">-&gt;</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {mode === "confirm" ? (
                                <TouchableOpacity className="mt-4" onPress={handleResendCode} disabled={isSubmitting}>
                                    <Text className="text-center text-sm font-pingfang-bold text-[#07111c]">
                                        Resend confirmation code
                                    </Text>
                                </TouchableOpacity>
                            ) : null}

                            <View className="my-6 flex-row items-center">
                                <View className="h-px flex-1 bg-[#e6ddd0]" />
                                <Text className="mx-4 text-xs font-pingfang-bold text-[#8d867c]">OR</Text>
                                <View className="h-px flex-1 bg-[#e6ddd0]" />
                            </View>

                            {mode === "login" ? (
                                <>
                                    <TouchableOpacity
                                        className="rounded-2xl border border-[#d7cdbf] py-4"
                                        onPress={() => switchMode("signup")}
                                    >
                                        <Text className="text-center text-base font-pingfang-bold text-[#07111c]">
                                            Create account
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity className="mt-4" onPress={() => switchMode("forgot")}>
                                        <Text className="text-center text-sm font-pingfang-bold text-[#6b6257]">
                                            Forgot password?
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <TouchableOpacity
                                    className="rounded-2xl border border-[#d7cdbf] py-4"
                                    onPress={() => switchMode("login")}
                                >
                                    <Text className="text-center text-base font-pingfang-bold text-[#07111c]">
                                        Back to login
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
