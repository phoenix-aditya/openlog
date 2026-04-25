"""Unit tests for slug_service — no DB or network required."""
import re

import pytest

from app.services.slug_service import generate_base_slug, generate_unique_slug


# ---------------------------------------------------------------------------
# generate_base_slug
# ---------------------------------------------------------------------------

class TestGenerateBaseSlug:
    def test_basic_title(self):
        assert generate_base_slug("Hello World") == "hello-world"

    def test_lowercase(self):
        assert generate_base_slug("UPPER CASE") == "upper-case"

    def test_spaces_become_hyphens(self):
        assert generate_base_slug("a b c") == "a-b-c"

    def test_special_chars_stripped(self):
        assert generate_base_slug("Hello, World!") == "hello-world"

    def test_consecutive_hyphens_collapsed(self):
        # multiple spaces → multiple hyphens → collapsed
        assert generate_base_slug("a  b") == "a-b"

    def test_leading_trailing_hyphens_stripped(self):
        assert generate_base_slug("  hello  ") == "hello"

    def test_empty_string(self):
        assert generate_base_slug("") == ""

    def test_all_special_chars(self):
        # no alphanumeric chars at all → empty string
        assert generate_base_slug("!@#$%^&*()") == ""

    def test_unicode_non_ascii_stripped(self):
        # non-ASCII letters are not in [a-z0-9], so they get stripped
        result = generate_base_slug("café au lait")
        assert re.fullmatch(r"[a-z0-9-]*", result)

    def test_unicode_only_title(self):
        result = generate_base_slug("日本語タイトル")
        # all chars stripped → empty string
        assert result == ""

    def test_numbers_preserved(self):
        assert generate_base_slug("Top 10 Tips") == "top-10-tips"

    def test_hyphens_in_title_preserved(self):
        assert generate_base_slug("well-known fact") == "well-known-fact"

    def test_slug_contains_only_valid_chars(self):
        titles = [
            "Hello World",
            "Python 3.12 Release Notes",
            "  spaces  ",
            "Special: chars & more!",
        ]
        for title in titles:
            slug = generate_base_slug(title)
            assert re.fullmatch(r"[a-z0-9-]*", slug), f"Invalid slug for {title!r}: {slug!r}"


# ---------------------------------------------------------------------------
# generate_unique_slug
# ---------------------------------------------------------------------------

class TestGenerateUniqueSlug:
    def test_no_conflict(self):
        assert generate_unique_slug("Hello World", set()) == "hello-world"

    def test_conflict_appends_2(self):
        assert generate_unique_slug("Hello World", {"hello-world"}) == "hello-world-2"

    def test_conflict_appends_3(self):
        existing = {"hello-world", "hello-world-2"}
        assert generate_unique_slug("Hello World", existing) == "hello-world-3"

    def test_suffix_increments_until_unique(self):
        existing = {f"hello-world-{i}" for i in range(2, 10)}
        existing.add("hello-world")
        result = generate_unique_slug("Hello World", existing)
        assert result == "hello-world-10"

    def test_empty_title_falls_back_to_untitled(self):
        result = generate_unique_slug("", set())
        assert result == "untitled"

    def test_empty_title_conflict(self):
        result = generate_unique_slug("", {"untitled"})
        assert result == "untitled-2"

    def test_all_special_chars_falls_back_to_untitled(self):
        result = generate_unique_slug("!@#$%", set())
        assert result == "untitled"

    def test_result_not_in_existing(self):
        existing = {"my-post", "my-post-2", "my-post-3"}
        result = generate_unique_slug("My Post", existing)
        assert result not in existing

    def test_distinct_titles_produce_distinct_slugs(self):
        titles = ["Alpha", "Beta", "Gamma", "Delta"]
        existing: set[str] = set()
        slugs = []
        for title in titles:
            slug = generate_unique_slug(title, existing)
            slugs.append(slug)
            existing.add(slug)
        assert len(slugs) == len(set(slugs))
