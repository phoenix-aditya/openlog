from sqlalchemy.orm import Session

from app.models import Blog, BlogTag, Tag


def get_or_create_tag(db: Session, name: str) -> Tag:
    tag = db.query(Tag).filter(Tag.name == name).first()
    if tag is None:
        tag = Tag(name=name)
        db.add(tag)
        db.commit()
        db.refresh(tag)
    return tag


def set_blog_tags(db: Session, blog: Blog, tag_names: list[str]) -> None:
    db.query(BlogTag).filter(BlogTag.blog_id == blog.id).delete()
    db.flush()
    for name in tag_names:
        tag = get_or_create_tag(db, name)
        db.add(BlogTag(blog_id=blog.id, tag_id=tag.id))
    db.commit()
