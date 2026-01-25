from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

# Load environment variables (GOOGLE_API_KEY)
load_dotenv()

# --------------------
# Initialize LLM client
# --------------------

llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0.3,
)

# --------------------
# Agent entry point
# --------------------

def generate_recommendation(request):
    """
    Placeholder draft agent.
    No prompts, tools, or memory yet.
    """
    return "LLM is wired"
