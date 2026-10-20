import { validatePublicEnvironment } from "./validateEnvironment";

export type { AppEnvironment, PublicEnvironment } from "./validateEnvironment";
export { validatePublicEnvironment } from "./validateEnvironment";

export const publicEnvironment = validatePublicEnvironment({
    appEnvironment: process.env.EXPO_PUBLIC_APP_ENV,
    backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL,
    awsRegion: process.env.EXPO_PUBLIC_AWS_REGION,
    cognitoUserPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID,
    cognitoUserPoolClientId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID,
});
