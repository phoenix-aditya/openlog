import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, String, Text, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(Text, unique=True, nullable=False)
    username = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=True)
    google_id = Column(Text, unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    blogs = relationship("Blog", back_populates="author")
    drafts = relationship("Draft", back_populates="author")


class Blog(Base):
    __tablename__ = "blogs"
    __table_args__ = (UniqueConstraint("user_id", "slug", name="uq_blog_user_slug"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(Text, nullable=False)
    slug = Column(Text, nullable=False)
    md_path = Column(Text, nullable=False)
    published = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    author = relationship("User", back_populates="blogs")
    blog_tags = relationship("BlogTag", back_populates="blog", cascade="all, delete-orphan")


class Draft(Base):
    __tablename__ = "drafts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(Text, nullable=False, default="")
    md_path = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    author = relationship("User", back_populates="drafts")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, unique=True, nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("tags.id"), nullable=True)

    children = relationship("Tag", backref="parent", remote_side=[id])
    blog_tags = relationship("BlogTag", back_populates="tag")


class BlogTag(Base):
    __tablename__ = "blog_tags"

    blog_id = Column(UUID(as_uuid=True), ForeignKey("blogs.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("tags.id"), primary_key=True)

    blog = relationship("Blog", back_populates="blog_tags")
    tag = relationship("Tag", back_populates="blog_tags")
