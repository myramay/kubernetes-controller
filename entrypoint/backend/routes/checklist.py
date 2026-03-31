import os
import json
import anthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from utils.link_validator import validate_links, split_valid_invalid

router = APIRouter()


class ChecklistRequest(BaseModel):
    visa_type: str
    state: str
    family: str = ""
    time_in_us: str = ""
    goal: str = ""
    language: str = "en"
    urgency: str = ""
    documents: List[str] = []
    has_support: str = ""


def get_client():
    return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def build_prompt(profile: ChecklistRequest, failed_links: list = None) -> str:
    lang_instruction = (
        "Respond entirely in Spanish. All step_title and description fields must be in Spanish."
        if profile.language == "es"
        else "Respond in English."
    )
    failed_note = (
        f"\nIMPORTANT: Do NOT include any of these broken links: {failed_links}"
        if failed_links
        else ""
    )

    return f"""You are helping an immigrant navigate life in the US. Generate a personalized checklist of 6-8 concrete, actionable next steps.

User profile:
- Immigration status / visa type: {profile.visa_type}
- US State: {profile.state}
- Main goal: {profile.goal}
- Urgency: {profile.urgency}
- Documents available: {", ".join(profile.documents) if profile.documents else "none"}
- Has caseworker / lawyer / sponsor: {profile.has_support or "no"}
- Time in US: {profile.time_in_us or "unknown"}
- Family situation: {profile.family or "not specified"}
{failed_note}

{lang_instruction}

Return ONLY a valid JSON array. Each step object must have exactly these fields:
- "step_title": short action title (max 8 words)
- "description": 1-2 sentence plain-language explanation of what to do and why
- "official_link": a real working URL from uscis.gov, irs.gov, benefits.gov, dol.gov, hhs.gov, or a verified nonprofit (.org). No Wikipedia, no news sites.
- "urgency": one of "immediate", "soon", or "when_ready"

Prioritize steps that are most relevant given the urgency level. For undocumented or asylum cases, include steps that are safe and protective.

Return only the JSON array, no markdown, no explanation."""


async def fetch_checklist(profile: ChecklistRequest, failed_links: list = None) -> list:
    client = get_client()
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        messages=[{"role": "user", "content": build_prompt(profile, failed_links)}],
    )
    text = message.content[0].text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
    return json.loads(text)


@router.post("/api/checklist")
async def generate_checklist(profile: ChecklistRequest):
    try:
        steps = await fetch_checklist(profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude API error: {str(e)}")

    for attempt in range(3):
        links = [s.get("official_link", "") for s in steps]
        if not links:
            break
        validation = await validate_links(links)
        valid_steps, failed_links = split_valid_invalid(steps, validation)

        if not failed_links:
            steps = valid_steps
            break

        if attempt < 2:
            try:
                replacement = await fetch_checklist(profile, failed_links=failed_links)
                steps = valid_steps + replacement[: len(failed_links)]
            except Exception:
                steps = valid_steps
                break
        else:
            steps = valid_steps

    return steps
