from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output" / "pdf" / "drafty_app_summary.pdf"


def para(text, style):
    return Paragraph(text, style)


def section(title, body, styles):
    return [
        para(title, styles["section"]),
        Spacer(1, 3),
        body,
        Spacer(1, 8),
    ]


def bullets(items, styles):
    story = []
    for item in items:
        story.append(para(f"- {item}", styles["bullet"]))
    return story


def list_block(items, styles):
    return Table(
        [[bullets(items, styles)]],
        colWidths=["100%"],
        style=TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        ),
    )


def build_styles():
    base = getSampleStyleSheet()
    font_dir = ROOT / "assets" / "fonts"
    pdfmetrics.registerFont(TTFont("Quicksand", str(font_dir / "Quicksand-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("Quicksand-Bold", str(font_dir / "Quicksand-Bold.ttf")))
    return {
        "title": ParagraphStyle(
            "Title",
            parent=base["Title"],
            fontName="Quicksand-Bold",
            fontSize=23,
            leading=26,
            textColor=colors.HexColor("#111827"),
            spaceAfter=2,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["BodyText"],
            fontName="Quicksand",
            fontSize=9.5,
            leading=12,
            textColor=colors.HexColor("#4B5563"),
        ),
        "section": ParagraphStyle(
            "Section",
            parent=base["Heading2"],
            fontName="Quicksand-Bold",
            fontSize=9.5,
            leading=11,
            textColor=colors.HexColor("#0F766E"),
            spaceAfter=0,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName="Quicksand",
            fontSize=8.7,
            leading=11,
            textColor=colors.HexColor("#1F2937"),
        ),
        "small": ParagraphStyle(
            "Small",
            parent=base["BodyText"],
            fontName="Quicksand",
            fontSize=7.2,
            leading=9,
            textColor=colors.HexColor("#6B7280"),
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=base["BodyText"],
            fontName="Quicksand",
            fontSize=7.8,
            leading=9.2,
            leftIndent=6,
            firstLineIndent=-6,
            textColor=colors.HexColor("#1F2937"),
        ),
        "run": ParagraphStyle(
            "Run",
            parent=base["BodyText"],
            fontName="Quicksand",
            fontSize=7.7,
            leading=9.4,
            leftIndent=8,
            firstLineIndent=-8,
            textColor=colors.HexColor("#1F2937"),
        ),
    }


def draw_page(canvas, doc):
    canvas.saveState()
    w, h = letter
    canvas.setFillColor(colors.HexColor("#F8FAFC"))
    canvas.rect(0, 0, w, h, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#0F766E"))
    canvas.rect(0, h - 0.18 * inch, w, 0.18 * inch, stroke=0, fill=1)
    canvas.setStrokeColor(colors.HexColor("#CBD5E1"))
    canvas.setLineWidth(0.7)
    canvas.line(0.55 * inch, 0.55 * inch, w - 0.55 * inch, 0.55 * inch)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.setFont("Quicksand", 6.8)
    canvas.drawString(
        0.55 * inch,
        0.37 * inch,
        "Generated from repo evidence: README.md, package.json, app screens, contexts, services, backend, and ADP ingestion script.",
    )
    canvas.restoreState()


def main():
    styles = build_styles()
    doc = BaseDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=0.55 * inch,
        rightMargin=0.55 * inch,
        topMargin=0.42 * inch,
        bottomMargin=0.68 * inch,
    )
    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        id="normal",
        showBoundary=0,
    )
    doc.addPageTemplates([PageTemplate(id="one", frames=[frame], onPage=draw_page)])

    what = (
        "Drafty is a cross-platform fantasy football mock drafting app for testing draft strategy before live drafts. "
        "It combines an Expo mobile UI, local ADP datasets, roster tracking, and AI-assisted player analysis."
    )
    who = "Fantasy football players preparing for drafts, especially users who want solo mock drafts, roster-aware pick decisions, and quick value feedback."
    features = [
        "Setup flow for pick timer, scoring format, draft order, team count, and draft slot.",
        "Solo draft screen listing players from bundled ADP JSON data.",
        "Tap-through player detail pages with season/projection panels and AI summary.",
        "Draft action adds players to roster state and prevents duplicate selections.",
        "Roster view tracks QB, RB, WR, TE, FLEX, D/ST, K, and bench slots.",
        "Client AI analysis calls Google Gemini with player, pick, league, and roster context.",
        "Backend FastAPI endpoint can return structured pick verdicts: STEAL, GOOD VALUE, FAIR VALUE, or REACH.",
    ]
    arch = [
        "Expo Router app: index -> setupScreen -> (draftTabs)/draftScreen, roster, and [name] detail.",
        "React contexts: DraftContext stores round/pick/timer/setup; RosterContext owns slot assignment and duplicate checks.",
        "Data: adp_halfPPR.json and adp_fullPPR.json feed player lists; test_adp_halfppr.py refreshes them from RapidAPI/Tank01.",
        "AI path A: services/aiService.js sends player + roster prompt to Gemini 2.0 Flash using EXPO_PUBLIC_GOOGLE_API_KEY.",
        "AI path B: backend/main.py exposes /draft/recommend; schemas.py validates requests; draft_agent.py calls Groq/LangChain; output_parser.py extracts verdict.",
        "Not found in repo: a wired frontend call to the FastAPI /draft/recommend endpoint.",
    ]
    run = [
        "1. Install app deps: npm install",
        "2. Start Expo: npm start",
        "3. Open platform target: npm run ios, npm run android, or npm run web",
        "4. For client AI summaries, set EXPO_PUBLIC_GOOGLE_API_KEY in the Expo environment.",
        "5. Backend dependencies/start command: Not found in repo. Evidence shows FastAPI app requires GROQ_API_KEY.",
    ]

    header = [
        para("Drafty", styles["title"]),
        para("AI Fantasy Football Mock Drafter", styles["subtitle"]),
        Spacer(1, 10),
    ]

    left = []
    left += section("What It Is", para(what, styles["body"]), styles)
    left += section("Who It's For", para(who, styles["body"]), styles)
    left += section("What It Does", list_block(features, styles), styles)

    right = []
    right += section("How It Works", list_block(arch, styles), styles)
    right += section("How To Run", list_block(run, styles), styles)

    grid = Table(
        [[left, right]],
        colWidths=[3.42 * inch, 3.42 * inch],
        style=TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (1, 0), (1, 0), 0),
                ("LINEBEFORE", (1, 0), (1, 0), 0.6, colors.HexColor("#CBD5E1")),
                ("LEFTPADDING", (1, 0), (1, 0), 12),
            ]
        ),
    )

    story = header + [grid]
    doc.build(story)
    print(OUT)


if __name__ == "__main__":
    main()
