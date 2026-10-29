import assert from "node:assert/strict";
import test from "node:test";

import { validatePublicEnvironment } from "../config/validateEnvironment.ts";

const validEnvironment = (appEnvironment) => ({
    appEnvironment,
    backendUrl:
        appEnvironment === "development"
            ? "http://localhost:8000/"
            : `https://${appEnvironment}-api.example.com/`,
    awsRegion: "us-east-1",
    cognitoUserPoolId: "us-east-1_example",
    cognitoUserPoolClientId: "exampleclientid",
});

for (const appEnvironment of ["development", "preview", "production"]) {
    test(`accepts the ${appEnvironment} client environment`, () => {
        const result = validatePublicEnvironment(validEnvironment(appEnvironment));

        assert.equal(result.appEnvironment, appEnvironment);
        assert.equal(result.backendUrl.endsWith("/"), false);
    });
}

test("reports the name of a missing public variable", () => {
    const environment = validEnvironment("development");
    environment.backendUrl = undefined;

    assert.throws(
        () => validatePublicEnvironment(environment),
        /EXPO_PUBLIC_BACKEND_URL is required/
    );
});

test("requires HTTPS outside development", () => {
    const environment = validEnvironment("preview");
    environment.backendUrl = "http://preview-api.example.com";

    assert.throws(
        () => validatePublicEnvironment(environment),
        /must use https in preview/
    );
});
