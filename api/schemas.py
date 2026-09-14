from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

StatusType = Literal["PENDING", "APPROVED", "REJECTED"]


class TestimonialBase(BaseModel):
    course_code: str = Field(min_length=1, max_length=128)
    course_category: str = Field(min_length=1, max_length=32)
    reviewer_name: str = Field(min_length=1, max_length=128)
    mis_no: str = Field(pattern=r"^(6125|6126)\d{5}$")
    subject_cgpa: float = Field(ge=0.0, le=10.0)
    overall_cgpa: float = Field(ge=0.0, le=10.0)
    difficulty_level: int = Field(ge=1, le=4)
    workload_level: int = Field(ge=1, le=4)
    new_field_exploration: int = Field(ge=1, le=4)
    concept_heavy: int = Field(ge=1, le=4)
    math_heavy: int = Field(ge=1, le=4)
    practical_focus: int = Field(ge=1, le=4)
    written_review: str = Field(min_length=1)


class TestimonialCreate(TestimonialBase):
    pass


class TestimonialResponse(TestimonialBase):
    id: int
    status: StatusType
    is_featured: bool

    model_config = ConfigDict(from_attributes=True)


TestimonialOut = TestimonialResponse


class TestimonialStatusUpdate(BaseModel):
    status: Literal["APPROVED", "REJECTED"]


class TestimonialFeatureUpdate(BaseModel):
    is_featured: bool
