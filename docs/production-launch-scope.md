# Drafty production launch scope

Status: approved product boundary for the first production release

Launch platform: iOS

Source decision: GitHub issue #1

## Product promise

Drafty helps an authenticated fantasy-football player practice a complete solo mock draft and receive contextual AI guidance on individual picks. The first production release is a focused iOS product, not a general-purpose league or chat platform.

## In scope

### Account access

- Account creation, confirmation, sign-in, sign-out, and the existing account-recovery flow.
- An authenticated session is required to enter the app and start a draft.

### Solo mock draft

- Configure and complete a solo draft against automated opponents.
- Support PPR and Half PPR scoring formats. Each format must use its matching ranking dataset and AI context.
- Support snake and linear draft orders.
- Configure the pick timer, league size, and the user's draft slot within validated limits.
- Run automated opponent picks and auto-draft an eligible player when the user's timer expires.
- Prevent duplicate selections and invalid roster additions.
- Show the live draft board, the user's current roster, and a final roster/results view.
- Start another draft or return home after completion.

### AI pick guidance

- Selecting an available player opens a detail view with an AI verdict and concise explanation based on the current pick, roster, league settings, and available players.
- AI guidance is advisory. It must not make or block a user's pick.
- Loading, provider failure, timeout, malformed response, and unavailable states must preserve the ability to draft.
- The product must distinguish sourced facts from model-generated analysis and must not present invented facts as player data.

### Player and ranking data

- Player identity, team, position, format-specific rank, and ADP come from validated deterministic data sources.
- Production ranking snapshots are refreshed at least daily during the active draft season.
- Every snapshot records scoring format, season, provider, and retrieval time.
- A failed refresh preserves the last valid snapshot and is observable. Stale data is disclosed without blocking a draft.
- The player screen shows only fields that have a typed, deterministic source and a clear decision-making purpose. Name, team, position, rank/ADP, source freshness, and AI evidence are the launch baseline. Unsourced age, historical statistics, and projections are prohibited.

## Explicitly out of scope

The following are not part of the first production release and must not appear as active or "coming soon" controls:

- Multiplayer rooms or a Join Room flow.
- A standalone conversational AI chat or Talk to AI Agent flow.
- Android and web production distribution.
- Standard-scoring drafts.
- A roster-summary control or end-of-draft grading until the existing grading work is implemented and accepted.

Out-of-scope features have no promised release date. They enter the product only through an approved issue that updates this scope.

## Truthful-interface rules

- Every visible action must perform its labeled behavior.
- Do not ship empty handlers, placeholder routes, fabricated values, or "coming soon" screens.
- A disabled control is acceptable only for a temporary state the user can resolve within the current flow, such as waiting for an opponent pick. It must explain why it is disabled when the reason is not obvious.
- Deferred features belong in the issue tracker, not in production navigation or marketing copy.

## Production acceptance criteria

The release is eligible for a go/no-go review only when all of the following are true:

- On a supported physical iPhone, a new user can create and confirm an account, sign in, sign out, and sign back in.
- An authenticated user can configure, complete, restart, and exit both a snake draft and a linear draft.
- PPR and Half PPR each resolve to the correct current ranking source; unsupported formats cannot start.
- Automated opponent picks and timeout auto-picks complete a full draft without stalls, duplicates, or invalid roster state.
- The live board, roster, pick counts, and results remain consistent throughout the draft.
- AI analysis succeeds against the production backend, and simulated AI failures never prevent a player selection or draft completion.
- No visible action is inert, and no production screen contains placeholder promises or fabricated player facts.
- Ranking data meets the freshness policy or displays the approved non-blocking stale-data state.
- Frontend lint and type checks, backend automated tests, and the repository's production build checks pass.
- The iOS production candidate passes the documented manual smoke test and release checklist.

## Backlog boundaries

Implementation details remain in their focused issues. Relevant follow-ups include:

- #11–#14: normalized data, ingestion, freshness, and scoring-format selection.
- #28–#32: draft grading, roster construction scoring, aggregation, and recap UI.
- #52: sourced player details and cited AI insights.
- #53: roster navigation and placeholder cleanup.
- #55–#62: production deployment, observability, policies, beta validation, and release readiness.

These issues may refine implementation, but they may not silently broaden the first-release product promise.

## Scope-change rule

Any proposed launch feature must identify its user value, source of truth, failure behavior, tests, and effect on this release boundary. If it adds a new workflow or external dependency, create or update a focused issue and explicitly amend this document before presenting the feature as part of launch.
