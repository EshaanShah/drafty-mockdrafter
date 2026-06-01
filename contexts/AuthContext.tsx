import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import "@/services/amplifyClient";
import {
    autoSignIn as amplifyAutoSignIn,
    confirmResetPassword as amplifyConfirmResetPassword,
    confirmSignUp as amplifyConfirmSignUp,
    fetchAuthSession,
    fetchUserAttributes,
    getCurrentUser,
    resendSignUpCode as amplifyResendSignUpCode,
    resetPassword as amplifyResetPassword,
    signIn as amplifySignIn,
    signOut as amplifySignOut,
    signUp as amplifySignUp,
} from "aws-amplify/auth";

type AuthUser = {
    email: string;
    userId: string;
};

type AppAuthSession = {
    accessToken: string;
    idToken?: string;
};

type AuthNextStep = "CONFIRM_SIGN_UP" | "RESET_PASSWORD";

type AuthResult = {
    success: boolean;
    message?: string;
    nextStep?: AuthNextStep;
};

type SignUpProfile = {
    birthdate: string;
    preferredUsername: string;
};

type AuthContextType = {
    user: AuthUser | null;
    session: AppAuthSession | null;
    isAuthenticated: boolean;
    isAuthReady: boolean;
    signIn: (email: string, password: string) => Promise<AuthResult>;
    signUp: (email: string, password: string, profile: SignUpProfile) => Promise<AuthResult>;
    confirmSignUp: (email: string, code: string) => Promise<AuthResult>;
    resendSignUpCode: (email: string) => Promise<AuthResult>;
    resetPassword: (email: string) => Promise<AuthResult>;
    confirmResetPassword: (email: string, code: string, newPassword: string) => Promise<AuthResult>;
    signOut: () => Promise<void>;
    refreshAuthSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

const getAuthErrorDetails = (error: unknown) => {
    if (error && typeof error === "object") {
        const errorRecord = error as { name?: unknown; message?: unknown };

        return {
            name: typeof errorRecord.name === "string" ? errorRecord.name : undefined,
            message: typeof errorRecord.message === "string" ? errorRecord.message : undefined,
        };
    }

    return {
        name: undefined,
        message: typeof error === "string" ? error : undefined,
    };
};

const getErrorMessage = (error: unknown) => {
    const { name, message } = getAuthErrorDetails(error);

    if (__DEV__) {
        console.warn("Cognito auth error", { name, message, error });
    }

    if (name) {
        if (name === "UserNotConfirmedException") {
            return "Please confirm your email before logging in.";
        }

        if (name === "NotAuthorizedException") {
            return "Email or password is incorrect.";
        }

        if (name === "UsernameExistsException") {
            return "An account already exists for this email.";
        }

        if (name === "CodeMismatchException") {
            return "That confirmation code is not correct.";
        }

        if (name === "ExpiredCodeException") {
            return "That code expired. Please request a new one.";
        }

        if (name === "LimitExceededException") {
            return "Too many attempts. Please wait a bit and try again.";
        }

        if (name === "UserNotFoundException") {
            return "No account exists for this email.";
        }

        if (name === "InvalidParameterException") {
            if (message?.includes("USER_PASSWORD_AUTH flow not enabled")) {
                return "Cognito App Client must enable USER_PASSWORD_AUTH. In AWS Console, enable ALLOW_USER_PASSWORD_AUTH for this app client.";
            }

            return message || "One of the auth fields is invalid.";
        }

        if (name === "InvalidPasswordException") {
            return message || "Password does not meet the required rules.";
        }
    }

    if (message) {
        if (message.toLowerCase().includes("already a signed in user")) {
            return "You are already logged in. Log out first if you want to use a different account.";
        }

        return message;
    }

    return "Something went wrong. Please try again.";
};

const validateEmail = (email: string): AuthResult => {
    const safeEmail = normalizeEmail(email);

    if (!safeEmail) {
        return { success: false, message: "Email is required." };
    }

    if (!isValidEmail(safeEmail)) {
        return { success: false, message: "Enter a valid email address." };
    }

    return { success: true };
};

const validatePassword = (password: string): AuthResult => {
    if (!password) {
        return { success: false, message: "Password is required." };
    }

    if (password.length < 8) {
        return { success: false, message: "Password must be at least 8 characters." };
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
        return { success: false, message: "Password must include uppercase, lowercase, and a number." };
    }

    return { success: true };
};

const validateCredentials = (email: string, password: string): AuthResult => {
    const emailValidation = validateEmail(email);

    if (!emailValidation.success) {
        return emailValidation;
    }

    return validatePassword(password);
};

const validateSignUpProfile = (profile: SignUpProfile): AuthResult => {
    const safeUsername = profile.preferredUsername.trim();
    const safeBirthdate = profile.birthdate.trim();

    if (!safeUsername) {
        return { success: false, message: "Username is required." };
    }

    if (safeUsername.length < 3) {
        return { success: false, message: "Username must be at least 3 characters." };
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(safeUsername)) {
        return { success: false, message: "Username can only use letters, numbers, dots, underscores, and hyphens." };
    }

    if (!safeBirthdate) {
        return { success: false, message: "Birthdate is required." };
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(safeBirthdate)) {
        return { success: false, message: "Birthdate must use YYYY-MM-DD format." };
    }

    const birthdate = new Date(`${safeBirthdate}T00:00:00Z`);

    if (Number.isNaN(birthdate.getTime()) || birthdate.toISOString().slice(0, 10) !== safeBirthdate) {
        return { success: false, message: "Enter a real birthdate in YYYY-MM-DD format." };
    }

    if (birthdate > new Date()) {
        return { success: false, message: "Birthdate cannot be in the future." };
    }

    return { success: true };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [session, setSession] = useState<AppAuthSession | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    const clearLocalAuth = useCallback(() => {
        setUser(null);
        setSession(null);
    }, []);

    const refreshAuthSession = useCallback(async () => {
        try {
            const [currentUser, authSession, attributes] = await Promise.all([
                getCurrentUser(),
                fetchAuthSession(),
                fetchUserAttributes(),
            ]);

            const accessToken = authSession.tokens?.accessToken?.toString();

            if (!accessToken) {
                clearLocalAuth();
                return;
            }

            setUser({
                email: attributes.email || currentUser.signInDetails?.loginId || currentUser.username,
                userId: currentUser.userId,
            });
            setSession({
                accessToken,
                idToken: authSession.tokens?.idToken?.toString(),
            });
        } catch {
            clearLocalAuth();
        }
    }, [clearLocalAuth]);

    useEffect(() => {
        refreshAuthSession().finally(() => setIsAuthReady(true));
    }, [refreshAuthSession]);

    const signIn = useCallback(async (email: string, password: string) => {
        const safeEmail = normalizeEmail(email);
        const validation = validateCredentials(safeEmail, password);

        if (!validation.success) {
            return validation;
        }

        try {
            const result = await amplifySignIn({
                username: safeEmail,
                password,
                options: {
                    authFlowType: "USER_PASSWORD_AUTH",
                },
            });

            if (result.nextStep.signInStep === "CONFIRM_SIGN_UP") {
                return {
                    success: false,
                    message: "Please confirm your email before logging in.",
                    nextStep: "CONFIRM_SIGN_UP" as const,
                };
            }

            if (result.nextStep.signInStep === "RESET_PASSWORD") {
                return {
                    success: false,
                    message: "Password reset is required before logging in.",
                    nextStep: "RESET_PASSWORD" as const,
                };
            }

            if (!result.isSignedIn) {
                return {
                    success: false,
                    message: `Additional sign-in step required: ${result.nextStep.signInStep}`,
                };
            }

            await refreshAuthSession();
            return { success: true };
        } catch (error) {
            const message = getErrorMessage(error);

            return {
                success: false,
                message,
                nextStep: message.includes("confirm your email") ? "CONFIRM_SIGN_UP" as const : undefined,
            };
        }
    }, [refreshAuthSession]);

    const signUp = useCallback(async (email: string, password: string, profile: SignUpProfile) => {
        const safeEmail = normalizeEmail(email);
        const validation = validateCredentials(safeEmail, password);

        if (!validation.success) {
            return validation;
        }

        const profileValidation = validateSignUpProfile(profile);

        if (!profileValidation.success) {
            return profileValidation;
        }

        try {
            const result = await amplifySignUp({
                username: safeEmail,
                password,
                options: {
                    userAttributes: {
                        birthdate: profile.birthdate.trim(),
                        email: safeEmail,
                        preferred_username: profile.preferredUsername.trim(),
                    },
                    autoSignIn: {
                        authFlowType: "USER_PASSWORD_AUTH",
                    },
                },
            });

            if (result.isSignUpComplete) {
                await refreshAuthSession();
                return { success: true };
            }

            return {
                success: true,
                message: "Check your email for the confirmation code.",
                nextStep: "CONFIRM_SIGN_UP" as const,
            };
        } catch (error) {
            return { success: false, message: getErrorMessage(error) };
        }
    }, [refreshAuthSession]);

    const confirmSignUp = useCallback(async (email: string, code: string) => {
        const safeEmail = normalizeEmail(email);
        const emailValidation = validateEmail(safeEmail);

        if (!emailValidation.success) {
            return emailValidation;
        }

        if (!code.trim()) {
            return { success: false, message: "Confirmation code is required." };
        }

        try {
            await amplifyConfirmSignUp({
                username: safeEmail,
                confirmationCode: code.trim(),
            });

            try {
                const autoSignInResult = await amplifyAutoSignIn();

                if (autoSignInResult.isSignedIn) {
                    await refreshAuthSession();
                    return { success: true };
                }
            } catch {
                return { success: true, message: "Email confirmed. Please log in." };
            }

            return { success: true, message: "Email confirmed. Please log in." };
        } catch (error) {
            return { success: false, message: getErrorMessage(error) };
        }
    }, [refreshAuthSession]);

    const resendSignUpCode = useCallback(async (email: string) => {
        const safeEmail = normalizeEmail(email);
        const emailValidation = validateEmail(safeEmail);

        if (!emailValidation.success) {
            return emailValidation;
        }

        try {
            await amplifyResendSignUpCode({ username: safeEmail });
            return { success: true, message: "A new confirmation code was sent." };
        } catch (error) {
            return { success: false, message: getErrorMessage(error) };
        }
    }, []);

    const resetPassword = useCallback(async (email: string) => {
        const safeEmail = normalizeEmail(email);
        const emailValidation = validateEmail(safeEmail);

        if (!emailValidation.success) {
            return emailValidation;
        }

        try {
            await amplifyResetPassword({ username: safeEmail });
            return { success: true, message: "Check your email for a password reset code." };
        } catch (error) {
            return { success: false, message: getErrorMessage(error) };
        }
    }, []);

    const confirmResetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
        const safeEmail = normalizeEmail(email);
        const emailValidation = validateEmail(safeEmail);

        if (!emailValidation.success) {
            return emailValidation;
        }

        if (!code.trim()) {
            return { success: false, message: "Reset code is required." };
        }

        const passwordValidation = validatePassword(newPassword);

        if (!passwordValidation.success) {
            return passwordValidation;
        }

        try {
            await amplifyConfirmResetPassword({
                username: safeEmail,
                confirmationCode: code.trim(),
                newPassword,
            });
            return { success: true, message: "Password reset. You can log in now." };
        } catch (error) {
            return { success: false, message: getErrorMessage(error) };
        }
    }, []);

    const signOut = useCallback(async () => {
        try {
            await amplifySignOut();
        } finally {
            clearLocalAuth();
        }
    }, [clearLocalAuth]);

    const value = useMemo(
        () => ({
            user,
            session,
            isAuthenticated: Boolean(user && session),
            isAuthReady,
            signIn,
            signUp,
            confirmSignUp,
            resendSignUpCode,
            resetPassword,
            confirmResetPassword,
            signOut,
            refreshAuthSession,
        }),
        [
            confirmResetPassword,
            confirmSignUp,
            isAuthReady,
            refreshAuthSession,
            resendSignUpCode,
            resetPassword,
            session,
            signIn,
            signOut,
            signUp,
            user,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
};
