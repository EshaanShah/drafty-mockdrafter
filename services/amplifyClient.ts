import { Amplify } from 'aws-amplify';

export const cognitoConfig = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_EBo3Vwb8X',
    userPoolClientId: '3qlmbv7qrr9kg8hsjsu42g462v',
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
