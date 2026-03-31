import os
import json
import anthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from utils.link_validator import validate_links, split_valid_invalid

router = APIRouter()


class ResourcesRequest(BaseModel):
    visa_type: str
    state: str
    goal: str = ""
    language: str = "en"
    urgency: str = ""
    documents: List[str] = []


def get_client():
    return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def build_prompt(profile: ResourcesRequest, failed_links: list = None) -> str:
    lang_instruction = (
        "Respond entirely in Spanish. All resource_type and why_it_matters fields must be in Spanish."
        if profile.language == "es"
        else "Respond in English."
    )
    failed_note = (
        f"\nIMPORTANT: Do NOT include any of these broken links: {failed_links}"
        if failed_links
        else ""
    )

    return f"""You are helping an immigrant find free, trustworthy resources in the US. Suggest 4-5 relevant resource categories.

User profile:
- Immigration status / visa type: {profile.visa_type}
- US State: {profile.state}
- Main goal: {profile.goal}
- Urgency: {profile.urgency}
- Documents available: {", ".join(profile.documents) if profile.documents else "none"}
{failed_note}

{lang_instruction}

Return ONLY a valid JSON array. Each resource object must have exactly these fields:
- "resource_type": category name (e.g. "Free Legal Aid", "Healthcare Enrollment", "Food Assistance")
- "why_it_matters": one sentence explaining why this matters specifically for this person
- "official_link": a real working URL from a .gov site or verified nonprofit (.org)

Only free resources. No paid services.

Return only the JSON array, no markdown, no explanation."""


async def fetch_resources(profile: ResourcesRequest, failed_links: list = None) -> list:
    client = get_client()
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": build_prompt(profile, failed_links)}],
    )
    text = message.content[0].text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
    return json.loads(text)


@router.post("/api/resources")
async def suggest_resources(profile: ResourcesRequest):
    try:
        resources = await fetch_resources(profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude API error: {str(e)}")

    for attempt in range(3):
        links = [r.get("official_link", "") for r in resources]
        if not links:
            break
        validation = await validate_links(links)
        valid_resources, failed_links = split_valid_invalid(resources, validation)

        if not failed_links:
            resources = valid_resources
            break

        if attempt < 2:
            try:
                replacement = await fetch_resources(profile, failed_links=failed_links)
                resources = valid_resources + replacement[: len(failed_links)]
            except Exception:
                resources = valid_resources
                break
        else:
            resources = valid_resources

    return resources
