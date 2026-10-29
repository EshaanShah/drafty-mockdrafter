export type AppEnvironment = "development" | "preview" | "production";

export type PublicEnvironment = Readonly<{
    appEnvironment: AppEnvironment;
    backendUrl: string;
    awsRegion: string;
    cognitoUserPoolId: string;
    cognitoUserPoolClientId: string;
}>;

export type RawPublicEnvironment = {
    appEnvironment: string | undefined;
    backendUrl: string | undefined;
    awsRegion: string | undefined;
    cognitoUserPoolId: string | undefined;
    cognitoUserPoolClientId: string | undefined;
};

const APP_ENVIRONMENTS: ReadonlySet<string> = new Set([
    "development",
    "preview",
    "production",
]);

const requireValue = (value: string | undefined, variableName: string) => {
    const trimmedValue = value?.trim();

    if (!trimmedValue) {
        throw new Error(
            `[environment] ${variableName} is required. Copy .env.example to .env.local for local development, or set it in the selected EAS environment.`
        );
    }

    return trimmedValue;
};

export const validatePublicEnvironment = (
    rawEnvironment: RawPublicEnvironment
): PublicEnvironment => {
    const appEnvironment = requireValue(
        rawEnvironment.appEnvironment,
        "EXPO_PUBLIC_APP_ENV"
    );

    if (!APP_ENVIRONMENTS.has(appEnvironment)) {
        throw new Error(
            `[environment] EXPO_PUBLIC_APP_ENV must be development, preview, or production; received "${appEnvironment}".`
        );
    }

    const backendUrl = requireValue(
        rawEnvironment.backendUrl,
        "EXPO_PUBLIC_BACKEND_URL"
    );
    let parsedBackendUrl: URL;

    try {
        parsedBackendUrl = new URL(backendUrl);
    } catch {
        throw new Error(
            `[environment] EXPO_PUBLIC_BACKEND_URL must be a complete http(s) URL; received "${backendUrl}".`
        );
    }

    if (parsedBackendUrl.protocol !== "http:" && parsedBackendUrl.protocol !== "https:") {
        throw new Error(
            `[environment] EXPO_PUBLIC_BACKEND_URL must use http or https; received "${parsedBackendUrl.protocol}".`
        );
    }

    if (appEnvironment !== "development" && parsedBackendUrl.protocol !== "https:") {
        throw new Error(
            `[environment] EXPO_PUBLIC_BACKEND_URL must use https in ${appEnvironment}.`
        );
    }

    const awsRegion = requireValue(rawEnvironment.awsRegion, "EXPO_PUBLIC_AWS_REGION");
    if (!/^[a-z]{2}(?:-gov)?-[a-z]+-\d$/.test(awsRegion)) {
        throw new Error(
            `[environment] EXPO_PUBLIC_AWS_REGION is not a valid AWS region; received "${awsRegion}".`
        );
    }

    const cognitoUserPoolId = requireValue(
        rawEnvironment.cognitoUserPoolId,
        "EXPO_PUBLIC_COGNITO_USER_POOL_ID"
    );
    if (!/^[\w-]+_[0-9A-Za-z]+$/.test(cognitoUserPoolId)) {
        throw new Error(
            "[environment] EXPO_PUBLIC_COGNITO_USER_POOL_ID must be a valid Cognito user pool ID."
        );
    }

    const cognitoUserPoolClientId = requireValue(
        rawEnvironment.cognitoUserPoolClientId,
        "EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID"
    );
    if (!/^[0-9a-z]+$/.test(cognitoUserPoolClientId)) {
        throw new Error(
            "[environment] EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID must be a valid Cognito app client ID."
        );
    }

    return Object.freeze({
        appEnvironment: appEnvironment as AppEnvironment,
        backendUrl: backendUrl.replace(/\/+$/, ""),
        awsRegion,
        cognitoUserPoolId,
        cognitoUserPoolClientId,
    });
};
