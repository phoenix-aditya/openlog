import re


def generate_base_slug(title: str) -> str:
    """Convert a blog title into a URL-safe slug."""
    slug = title.lower()
    slug = slug.replace(" ", "-")
    slug = re.sub(r"[^a-z0-9-]", "", slug)
    slug = re.sub(r"-{2,}", "-", slug)
    slug = slug.strip("-")
    return slug


def generate_unique_slug(title: str, existing_slugs: set[str]) -> str:
    """Generate a slug that is unique within the given set of existing slugs."""
    base = generate_base_slug(title) or "untitled"

    if base not in existing_slugs:
        return base

    counter = 2
    while True:
        candidate = f"{base}-{counter}"
        if candidate not in existing_slugs:
            return candidate
        counter += 1
