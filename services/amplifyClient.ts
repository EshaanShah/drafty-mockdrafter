import { Amplify } from 'aws-amplify';
import { publicEnvironment } from '@/config/environment';

export const cognitoConfig = {
    region: publicEnvironment.awsRegion,
    userPoolId: publicEnvironment.cognitoUserPoolId,
    userPoolClientId: publicEnvironment.cognitoUserPoolClientId,
};

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: cognitoConfig.userPoolId,
            userPoolClientId: cognitoConfig.userPoolClientId,
            signUpVerificationMethod: 'code',
            loginWith: {
                email: true,
            },
            userAttributes: {
                birthdate: {
                    required: true,
                },
                email: {
                    required: true,
                },
                preferred_username: {
                    required: true,
                },
            },
            passwordFormat: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireNumbers: true,
                requireSpecialCharacters: false,
            },
        },
    },
});
