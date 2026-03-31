import os
import json
import anthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/ngos.json")


class NGORequest(BaseModel):
    visa_type: str
    state: str
    goal: str = ""


def get_client():
    return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


@router.post("/api/ngos")
async def filter_ngos(profile: NGORequest):
    try:
        with open(DATA_PATH) as f:
            all_ngos = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not load NGO data: {str(e)}")

    # Pre-filter by state
    eligible = [
        n for n in all_ngos
        if "all" in n.get("states", []) or profile.state in n.get("states", [])
    ]

    if not eligible:
        eligible = all_ngos  # fallback: use all if none match state

    ngo_list_text = json.dumps(eligible, indent=2)

    prompt = f"""You are helping an immigrant find trustworthy support organizations.

User profile:
- Immigration status / visa type: {profile.visa_type}
- US State: {profile.state}
- Main goal: {profile.goal}

Here is the verified NGO database (use ONLY these organizations — do not invent others):
{ngo_list_text}

Pick the 3-4 NGOs that best match this person's situation, visa type, and goal.
Write one sentence explaining why each one is relevant to this specific person.

Return ONLY a valid JSON array. Each item must have exactly these fields (copy phone/website/languages verbatim from the database above — never modify contact info):
- "name": exact name from the list
- "reason": one sentence why this NGO fits this person
- "phone": exact phone from the list (empty string if none)
- "website": exact website from the list
- "languages": exact languages array from the list

Return only the JSON array, no markdown, no explanation."""

    try:
        client = get_client()
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        text = message.content[0].text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
        return json.loads(text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude API error: {str(e)}")
