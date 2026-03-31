import asyncio
import httpx


async def validate_link(url: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
            response = await client.head(url, headers={"User-Agent": "Mozilla/5.0"})
            if response.status_code == 405:
                # HEAD not allowed — try GET
                response = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            return response.status_code < 400
    except Exception:
        return False


async def validate_links(links: list) -> dict:
    results = await asyncio.gather(*[validate_link(url) for url in links])
    return dict(zip(links, results))


def split_valid_invalid(items: list, validation: dict, link_key: str = "official_link"):
    valid = [item for item in items if validation.get(item.get(link_key), True)]
    failed = [item[link_key] for item in items if not validation.get(item.get(link_key), True)]
    return valid, failed
