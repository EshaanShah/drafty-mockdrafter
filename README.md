# Drafty

Drafty is an iOS fantasy-football mock-drafting app for practicing complete solo drafts and receiving contextual AI guidance on individual picks.

## Production launch scope

The first production release is deliberately focused:

- iOS distribution.
- Required account creation and sign-in.
- Solo drafts against automated opponents.
- PPR and Half PPR ranking formats.
- Snake and linear draft orders.
- Configurable league size, draft slot, and pick timer.
- Live draft board, roster tracking, timeout auto-picks, and final results.
- Embedded AI verdicts and explanations for available players. AI failure never blocks drafting.
- Deterministically sourced player identity and ranking data, refreshed at least daily during draft season.

The canonical product boundary and release acceptance criteria are in [`docs/production-launch-scope.md`](docs/production-launch-scope.md).

## Not in the first release

- Multiplayer rooms.
- Standalone AI chat.
- Android or web production distribution.
- Standard-scoring drafts.
- Roster summaries and end-of-draft grading.

These are backlog candidates, not promised features or dated commitments. Production UI and marketing must not present them as available or "coming soon."

## Tech stack

### Mobile client

- React Native and Expo Router
- TypeScript
- NativeWind / Tailwind CSS
- AWS Amplify authentication

### Recommendation service

- Python and FastAPI
- Pydantic request and response contracts
- LangChain with Groq inference
- Deterministic draft-analysis helpers and bounded tool inputs

## Architecture principles

- Draft rules and factual data remain separate from model-generated analysis.
- Player facts must come from typed, validated sources; the AI may not invent ADP, injuries, trends, or statistics.
- Recommendation responses use a strict verdict-and-explanation contract.
- AI is advisory and fail-open so the core draft remains usable during provider failures.
- Ranking snapshots carry format, season, source, and retrieval metadata and retain the last valid data when refresh fails.

## Local development

Install frontend dependencies and run Expo:

```sh
npm install
npm start
```

The backend uses Python 3.13.7, recorded in `.python-version`. From a clean checkout, create the environment and install the locked development dependencies:

```sh
python3.13 -m venv .venv
.venv/bin/python -m pip install --upgrade pip==25.2
.venv/bin/python -m pip install --require-hashes -r backend/requirements-dev.txt
```

Run the API from the repository root:

```sh
.venv/bin/python -m uvicorn main:app --app-dir backend --reload
```

Current repository checks:

```sh
npm run lint
npx tsc --noEmit
.venv/bin/python -m pytest tests
```

`backend/requirements.in` and `backend/requirements-dev.in` contain the direct dependencies. Their corresponding `.txt` files are fully resolved lockfiles. After intentionally changing an input dependency, regenerate both locks with pip-tools 7.5.2 under Python 3.13.7:

```sh
.venv/bin/python -m pip install pip-tools==7.5.2
.venv/bin/pip-compile --generate-hashes --output-file=backend/requirements.txt backend/requirements.in
.venv/bin/pip-compile --generate-hashes --output-file=backend/requirements-dev.txt backend/requirements-dev.in
```

Environment-specific values belong in ignored environment files. Never commit secrets or embed private keys in the mobile client.

## Project status

Drafty is pre-production. Core draft flows exist, while the launch backlog covers data ingestion and freshness, environment hardening, backend deployment, observability, sourced player details, accessibility, beta validation, and App Store readiness. A feature is not considered production-ready until it satisfies the acceptance criteria in the launch scope.

## Author

Eshaan Shah
Computer Science & Statistics, University of Virginia

- [GitHub](https://github.com/EshaanShah)
- [LinkedIn](https://www.linkedin.com/in/Eshaan-Shah0)
