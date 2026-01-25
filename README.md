# Drafty — AI Fantasy Football Mock Drafter

Drafty is a cross-platform fantasy football mock drafting app that helps users simulate draft strategies across different league formats using real-time data and AI-assisted analytics.

The app allows fantasy football players to test draft positions, evaluate pick strategies, and gain confidence before live drafts.

**Status:** MVP complete. Actively upgrading AI analytics with an agent-based backend. Fixing minor bugs and improving UI.

---

## Features

- 🏈 Mock drafts across multiple fantasy football league formats  
- 🤖 AI-assisted draft insights and analytics  
- 📊 Real-time player data ingestion (ADP, rankings, performance trends)  
- 📱 Cross-platform mobile experience (iOS & Android)  
- 🎯 Strategy testing to evaluate draft paths and pick decisions  

---

## Tech Stack

### Frontend

- React Native  
- Expo Router  
- TypeScript  
- NativeWind / Tailwind CSS  

### Backend & AI

- Python  
- FastAPI (API layer for draft recommendations)  
- Pydantic (strict request/response schemas)  
- LangChain (agent-based reasoning framework)  
- Groq LLM (low-latency inference for draft analysis)  
- JSON-based APIs for live player and ranking data  

---

## Architecture Highlights (New)

Drafty’s AI system is being upgraded from a single-shot prompt model to a policy-driven agent architecture:

- **Policy-first prompting:**  
  Reasoning rules (Tier 1 / Tier 2 / Tier 3 logic) are defined separately from factual data.

- **Strict anti-hallucination design:**  
  The agent is forbidden from inventing ADP, injury status, or trends.  
  All factual inputs will be provided via tools (currently stubbed).

- **Schema-enforced contracts:**  
  DraftRequest and DraftResponse models enforce structure and prevent invalid or ambiguous inputs.

- **Future-proof agent flow:**  
  Designed to safely integrate real tools (ADP lookup, roster-fit analysis, risk evaluation) without changing reasoning logic.

This approach prioritizes correctness, explainability, and long-term maintainability over quick prompt hacks.

---

## Current Status

- ✅ Core mock draft engine implemented  
- ✅ End-to-end draft simulation flow complete  
- ✅ FastAPI backend integrated  
- ✅ Draft recommendation schemas finalized  
- ✅ Policy-based AI reasoning implemented  
- ✅ Groq-backed LLM wired via LangChain  
- ✅ Tool-calling behavior validated (tool execution coming next)  
- ✅ Reusable, responsive UI components built  

---

## 🔧 Currently Working On

- Completing tool execution loop for AI agent (ADP, roster fit, risk stubs → real data)  
- Improving AI draft recommendation depth and consistency  
- Refining verdict logic and contextual draft feedback  
- Minor UI and UX improvements  

The application is fully functional end-to-end.  
Current work focuses on analytical depth and correctness, not core functionality.

---

## Demo

Product demos and walkthroughs are available on my LinkedIn profile, including:

- Full mock draft flows  
- AI-driven draft insights  
- Live UI interactions  

👉 **LinkedIn:**  
https://www.linkedin.com/posts/eshaan-shah0_when-i-first-started-playing-fantasy-football-activity-7391835707948048384-Oblu

---

## Planned Release

**Target launch:** Summer (pre–NFL season)

**Reason:**  
Aligning release with peak fantasy football engagement for maximum demand and user adoption.

---

## Motivation

Drafty was built to address a gap in existing fantasy football tools — the lack of flexible mock drafting platforms that allow users to meaningfully test strategy and draft decision-making.

The project emphasizes:

- practical data modeling  
- user-centered product design  
- responsible, production-grade application of AI  

---

## Author

**Eshaan Shah**  
Computer Science & Statistics @ University of Virginia  

- **GitHub:** https://github.com/EshaanShah  
- **LinkedIn:** https://www.linkedin.com/in/Eshaan-Shah0
