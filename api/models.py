from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from api.database import Base


class Testimonial(Base):
    __tablename__ = "testimonials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_code: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    course_category: Mapped[str] = mapped_column(String(32), nullable=False)
    reviewer_name: Mapped[str] = mapped_column(String(128), nullable=False)
    mis_no: Mapped[str] = mapped_column(String(16), nullable=False)
    subject_cgpa: Mapped[float] = mapped_column(Float, nullable=False)
    overall_cgpa: Mapped[float] = mapped_column(Float, nullable=False)
    difficulty_level: Mapped[int] = mapped_column(Integer, nullable=False)
    workload_level: Mapped[int] = mapped_column(Integer, nullable=False)
    new_field_exploration: Mapped[int] = mapped_column(Integer, nullable=False)
    concept_heavy: Mapped[int] = mapped_column(Integer, nullable=False)
    math_heavy: Mapped[int] = mapped_column(Integer, nullable=False)
    practical_focus: Mapped[int] = mapped_column(Integer, nullable=False)
    written_review: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="PENDING", nullable=False, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
