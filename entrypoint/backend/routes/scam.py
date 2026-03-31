import os
import json
import anthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class ScamRequest(BaseModel):
    text: str


def get_client():
    return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


@router.post("/api/scam")
async def analyze_scam(request: ScamRequest):
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")

    prompt = f"""You are a scam detection expert helping immigrants in the US identify fraudulent messages, job offers, and communications that target vulnerable people.

Analyze this message for scam indicators, paying special attention to tactics that specifically target immigrants:

MESSAGE:
{request.text}

Look for these red flags:
- Visa bait (promises to "fix" immigration status)
- SSN or ITIN requests
- Fake government impersonation (fake ICE, USCIS, SSA)
- Upfront fee requests for free government services
- Notario fraud (fake immigration lawyers)
- Guaranteed visa promises
- Threats of deportation unless you pay
- Spoofed .gov domains
- Requests for wire transfer or gift cards
- Too-good-to-be-true job offers requiring documents

Return ONLY a valid JSON object with exactly these fields:
- "risk_score": integer 0-100 (0 = totally safe, 100 = definite scam)
- "risk_level": one of "low", "medium", "high", "critical"
- "red_flags": array of strings describing general red flags found (empty array if none)
- "immigrant_flags": array of strings describing immigrant-specific targeting tactics found (empty array if none)
- "recommended_action": one sentence of plain-language advice for what the person should do

Return only the JSON object, no markdown, no explanation."""

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
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")
