import re
from urllib.parse import urljoin
from urllib.request import urlopen


class ChatService:
    """Fetches website context (HTML + linked CSS/JS) for chat Q&A."""

    @staticmethod
    def _fetch_text(url: str, timeout: int = 8) -> str:
        with urlopen(url, timeout=timeout) as response:
            return response.read().decode("utf-8", errors="ignore")

    @staticmethod
    def fetch_site_snapshot(site_url: str) -> str:
        html = ChatService._fetch_text(site_url)

        css_parts = []
        js_parts = []

        css_hrefs = re.findall(r'<link[^>]+href=["\']([^"\']+\.css[^"\']*)["\']', html, flags=re.IGNORECASE)
        js_srcs = re.findall(r'<script[^>]+src=["\']([^"\']+\.js[^"\']*)["\']', html, flags=re.IGNORECASE)
        inline_styles = re.findall(r"<style[^>]*>(.*?)</style>", html, flags=re.IGNORECASE | re.DOTALL)
        inline_scripts = re.findall(r"<script(?![^>]+src=)[^>]*>(.*?)</script>", html, flags=re.IGNORECASE | re.DOTALL)

        for href in css_hrefs:
            try:
                css_parts.append(ChatService._fetch_text(urljoin(site_url, href)))
            except Exception:
                continue

        for src in js_srcs:
            try:
                js_parts.append(ChatService._fetch_text(urljoin(site_url, src)))
            except Exception:
                continue

        css_parts.extend(inline_styles)
        js_parts.extend(inline_scripts)

        snapshot = (
            "[HTML]\n"
            + html[:12000]
            + "\n\n[CSS]\n"
            + "\n\n/* --- */\n\n".join(part[:6000] for part in css_parts[:4])
            + "\n\n[JS]\n"
            + "\n\n// ---\n\n".join(part[:5000] for part in js_parts[:4])
        )
        return snapshot[:30000]
