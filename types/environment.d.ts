declare namespace NodeJS {
    interface ProcessEnv {
        readonly EXPO_PUBLIC_APP_ENV?: "development" | "preview" | "production";
        readonly EXPO_PUBLIC_BACKEND_URL?: string;
        readonly EXPO_PUBLIC_AWS_REGION?: string;
        readonly EXPO_PUBLIC_COGNITO_USER_POOL_ID?: string;
        readonly EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID?: string;
    }
}
