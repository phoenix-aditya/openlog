"""
HTML sanitizer for user-generated content (TipTap editor output).
Allows only the tags and attributes that TipTap's StarterKit produces.
Strips everything else, including <script>, event handlers, and javascript: hrefs.
"""
import bleach

ALLOWED_TAGS = [
    "p", "br",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "em", "s", "code", "pre",
    "ul", "ol", "li",
    "blockquote", "hr",
    "a", "img",
]

ALLOWED_ATTRIBUTES = {
    "a": ["href", "title", "target"],
    "img": ["src", "alt", "title"],
    "code": ["class"],   # for syntax highlighting classes
    "pre": ["class"],
}

# Strip disallowed tags entirely (don't escape them)
STRIP = True


def sanitize_html(html: str) -> str:
    return bleach.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=STRIP,
    )
