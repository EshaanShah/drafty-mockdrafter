# AGENTS.md

This file defines the working agreement for contributors and coding agents in this repository.

## Product source of truth

- Read `docs/production-launch-scope.md` before planning product or UI work.
- The first production release is an authenticated, iOS-only, solo mock-draft experience with embedded AI pick guidance.
- Launch scoring formats are PPR and Half PPR. Draft orders are snake and linear.
- Do not add multiplayer rooms, standalone AI chat, Android/web launch promises, Standard scoring, grading, or roster-summary promises unless the scope document is explicitly amended.
- Deferred work belongs in GitHub issues. Do not advertise it with inert buttons, placeholder routes, or "coming soon" copy.

## Repository map

- `app/`: Expo Router screens and navigation.
- `components/`: reusable React Native UI.
- `contexts/`: authentication, draft lifecycle, and roster state.
- `services/`: client integrations, including the recommendation API.
- `utils/`: shared frontend domain helpers.
- `backend/`: FastAPI recommendation service, schemas, agent policy, tools, and deterministic analysis.
- `tests/`: backend tests.
- `adp_*.json`: temporary ranking snapshots; treat them as sourced data, not hand-edited product content.

## Product invariants

- Every visible action works. Remove nonfunctional controls instead of leaving empty handlers.
- Never display fabricated player facts. User-visible facts require a typed deterministic source.
- PPR and Half PPR must resolve to matching ranking data and AI context.
- AI is advisory and fail-open: loading or failure must never prevent drafting.
- A player may be selected only once. Picks, roster state, timer state, and results must remain consistent.
- Automated and timeout picks must select an eligible player and allow the draft to progress.
- Authentication remains required for the production flow.
- Production data refreshes at least daily during draft season, retains the last valid snapshot on failure, and exposes freshness metadata.
- Secrets and credentials never belong in the client bundle, logs, fixtures, or committed files.

## Working practices

- Keep each change aligned to one issue. If necessary work exceeds that issue, open or identify a focused follow-up rather than broadening the patch silently.
- For issue-backed work, read the issue state and acceptance criteria before editing. Keep the issue open while its pull request is under review; completion is normally recorded by merging a PR that contains `Closes #<issue>`.
- If work is incomplete or blocked, leave the issue open and record completed work, remaining work, and blockers in a concise issue or PR comment. Do not mark an issue complete merely because implementation work stopped.
- Inspect nearby code and current tests before editing. Preserve unrelated user changes in the worktree.
- Prefer domain logic in pure functions or contexts over duplicating it in screens.
- Keep API contracts typed and validated on both sides of the boundary.
- Declare Python dependencies in `backend/requirements.in` or `backend/requirements-dev.in`; never edit the generated `.txt` lockfiles by hand. Regenerate both lockfiles with the pinned Python and pip-tools versions documented in README, and validate installs with `--require-hashes`.
- Include loading, empty, stale, unavailable, and failure behavior when adding data-backed UI.
- Do not claim a feature, platform, data source, or release state in README unless the implementation and acceptance evidence support it.
- Update `docs/production-launch-scope.md` and README when an approved product decision changes the launch boundary.

## GitHub workflow

- Do not commit issue work directly to the default branch. Create a short branch named `codex/<issue-number>-<slug>` from the intended base branch.
- Prefer one issue per pull request. Combine issues only when their changes are inseparable or substantially overlap, and explain the reason in the PR description.
- Commit only files that belong to the issue. Leave unrelated tracked or untracked user work untouched.
- Use small, logically complete commits with imperative messages such as `docs: define production launch scope` or `build: lock backend dependencies`.
- Before pushing, review `git status`, the staged diff, and the complete branch diff; run the relevant checks documented in this file.
- Push the issue branch and open a pull request against the repository's default branch. Never force-push a shared branch or bypass branch protection.
- Use a concise PR title and a body containing: purpose, notable changes, validation evidence, risks or follow-ups, and `Closes #<issue>` for every issue fully satisfied by the PR. Use `Refs #<issue>` instead when the PR is only partial.
- Ensure each issue is linked to its PR. Keep fully addressed issues open until the PR merges so GitHub's closing keyword records completion atomically with the shipped change.
- Do not merge, approve, or delete the branch unless the user requests it or the repository's documented automation owns that step.

## Validation

Run the narrowest relevant checks while developing, then run all checks supported by the current repository before handoff:

```sh
npm run lint
npm run typecheck
npm run export:web
.venv/bin/python -m pytest tests
```

Also perform a focused manual flow check for changed UI. Launch-affecting work must ultimately be exercised on a physical iPhone through account creation/sign-in, draft setup, a complete draft, AI success and failure, results, restart, and sign-out.

If a documented command cannot run from a clean checkout, report that honestly and link the applicable setup or CI issue; do not describe the check as passing.

## Definition of done

A change is done when its acceptance criteria are met, relevant automated checks pass, user-visible failure states are handled, documentation is truthful, and no new deferred promise or inert control has been introduced.
