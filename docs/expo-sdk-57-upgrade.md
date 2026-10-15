# Expo SDK 57 upgrade notes

Issue: #5

Date: 2026-10-15

## Baseline

Drafty moved from Expo SDK 53 / React Native 0.79 / React 19.0 to Expo SDK 57 / React Native 0.86 / React 19.2. SDK 57 is the current stable Expo release at the time of the upgrade; SDK 58 is still a beta and is not used for the production baseline.

The supported local and CI runtime is Node 22.13.0. It is pinned in `.nvmrc`, declared in `package.json`, and used by the frontend CI job. Node 23 is not supported by the SDK 57 Metro dependency range.

## Compatibility decisions

- Expo-managed packages, React, React Native, TypeScript, and the lint configuration use the versions selected by `expo install --fix` for SDK 57.
- `react-native-worklets` is now a direct dependency because Reanimated 4 requires its native peer to be installed explicitly.
- `newArchEnabled` and `edgeToEdgeEnabled` were removed from `app.json`. SDK 57 requires the New Architecture and Android edge-to-edge behavior, so these older opt-in flags are no longer valid configuration.
- The direct `@react-navigation/*` dependencies were removed. Expo Router 57 rejects direct React Navigation imports; `useFocusEffect` now comes from `expo-router`.
- React 19 lint findings were resolved in application code: each keyed player screen captures its AI analysis input in state instead of mutating a ref during render, timer notices update asynchronously, and draft-slot correction happens in the input event rather than synchronously in an effect.
- The project continues to use Continuous Native Generation and does not commit generated `ios/` or `android/` directories.

## Validation

Run from a clean checkout with Node 22.13.0:

```sh
npm ci
npx expo-doctor@latest
npm run lint
npm run typecheck
npm run export:ios
npm run export:android
npm run export:web
.venv/bin/python -m pytest tests
```

The export commands are platform bundle smoke checks. They do not replace the physical-iPhone production flow required by the launch scope.
