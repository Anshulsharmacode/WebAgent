import asyncio
import re
from urllib.parse import urljoin


class ChatService:
    """Fetches website context (HTML snapshot) for conversational Q&A."""

    @staticmethod
    async def fetch_site_snapshot(site_url: str, timeout: float = 5.0) -> str:
        """
        Async HTTP fetch of the site's HTML with a strict timeout.
        Only grabs the HTML — we skip fetching linked CSS/JS files since
        the LLM already has the full source files from the project directory.
        Falls back gracefully if the container is temporarily unavailable.
        """
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    site_url,
                    timeout=aiohttp.ClientTimeout(total=timeout),
                    ssl=False,
                ) as resp:
                    html = await resp.text(errors="ignore")

            # Pull inline styles/scripts only — no extra HTTP round-trips
            inline_styles = re.findall(
                r"<style[^>]*>(.*?)</style>",
                html,
                flags=re.IGNORECASE | re.DOTALL,
            )
            inline_scripts = re.findall(
                r"<script(?![^>]+src=)[^>]*>(.*?)</script>",
                html,
                flags=re.IGNORECASE | re.DOTALL,
            )

            snapshot = (
                "[HTML]\n"
                + html[:15000]
                + ("\n\n[INLINE CSS]\n" + "\n".join(inline_styles[:3]) if inline_styles else "")
                + ("\n\n[INLINE JS]\n" + "\n".join(s[:3000] for s in inline_scripts[:3]) if inline_scripts else "")
            )
            return snapshot[:28000]

        except Exception:
            # Container not reachable — return empty snapshot; LLM will still work
            return ""
