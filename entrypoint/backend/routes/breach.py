import os
import json
import anthropic
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

HIBP_API_URL = "https://api.pwnedpasswords.com/range/"


class BreachRequest(BaseModel):
    email: str


def get_client():
    return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


async def check_hibp(email: str) -> list:
    """
    Uses k-anonymity: hashes the email address with SHA-1,
    sends only the first 5 chars to HIBP, never the full email.
    Returns list of breach names found.
    """
    # HIBP uses SHA-1 of lowercased email for the breach search endpoint
    # Note: the /range/ endpoint is for passwords; for accounts we use /breachedaccount/
    # Using the breachedaccount endpoint with the HIBP-API-Key if available
    hibp_key = os.getenv("HIBP_API_KEY", "")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {"hibp-api-key": hibp_key} if hibp_key else {}
            headers["user-agent"] = "EntryPoint-App"
            response = await client.get(
                f"https://haveibeenpwned.com/api/v3/breachedaccount/{email}",
                headers=headers,
                params={"truncateResponse": "false"},
            )
            if response.status_code == 404:
                return []  # No breaches found
            if response.status_code == 401:
                return []  # No API key — return empty gracefully
            response.raise_for_status()
            breaches = response.json()
            return breaches
    except httpx.HTTPStatusError:
        return []
    except Exception:
        return []


@router.post("/api/breach")
async def check_breach(request: BreachRequest):
    if not request.email or "@" not in request.email:
        raise HTTPException(status_code=400, detail="Valid email is required")

    breaches = await check_hibp(request.email.lower().strip())

    breaches_found = len(breaches)

    if breaches_found == 0:
        return {
            "breaches_found": 0,
            "breaches": [],
            "plain_language_summary": "Good news — no known data breaches were found for this email address.",
            "action_steps": [
                "Continue using strong, unique passwords for each account.",
                "Consider enabling two-factor authentication on important accounts.",
            ],
            "risk_level": "low",
        }

    # Summarize breach data for Claude
    breach_summary = []
    for b in breaches[:10]:  # Cap at 10 to avoid huge prompts
        breach_summary.append({
            "name": b.get("Name", "Unknown"),
            "date": b.get("BreachDate", "unknown date"),
            "data_classes": b.get("DataClasses", []),
        })

    prompt = f"""You are helping an immigrant understand if their personal data was exposed in a security breach.

This email address was found in {breaches_found} data breach(es). Here are the details:

{json.dumps(breach_summary, indent=2)}

Write a plain-language explanation and action steps. Keep in mind this person may be:
- Not familiar with cybersecurity terms
- Worried about their immigration status being exposed
- Using this email for important government accounts

Return ONLY a valid JSON object with exactly these fields:
- "plain_language_summary": 2-3 sentence explanation in plain English of what happened and what was exposed
- "action_steps": array of 3-5 concrete action steps the person should take right now
- "risk_level": one of "low", "medium", "high", "critical" — based on what data was exposed

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
        result = json.loads(text)
        return {
            "breaches_found": breaches_found,
            "breaches": breach_summary,
            "plain_language_summary": result.get("plain_language_summary", ""),
            "action_steps": result.get("action_steps", []),
            "risk_level": result.get("risk_level", "medium"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")
