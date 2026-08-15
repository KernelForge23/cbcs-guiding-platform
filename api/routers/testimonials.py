from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy import desc
from sqlalchemy.orm import Session

from api.database import get_db
from api.models import Testimonial
from api.schemas import (
    TestimonialCreate,
    TestimonialFeatureUpdate,
    TestimonialOut,
    TestimonialStatusUpdate,
)

router = APIRouter(prefix="/api", tags=["testimonials"])


@router.post("/testimonials/", response_model=TestimonialOut, status_code=201)
def create_testimonial(
    payload: TestimonialCreate,
    db: Session = Depends(get_db),
):
    testimonial = Testimonial(
        course_code=payload.course_code.strip(),
        course_category=payload.course_category,
        reviewer_name=payload.reviewer_name.strip(),
        mis_no=payload.mis_no,
        subject_cgpa=payload.subject_cgpa,
        overall_cgpa=payload.overall_cgpa,
        prior_knowledge=payload.prior_knowledge,
        difficulty=payload.difficulty,
        workload=payload.workload,
        cognitive_focus=payload.cognitive_focus,
        written_review=payload.written_review.strip(),
        status="PENDING",
        is_featured=False,
    )
    db.add(testimonial)
    db.commit()
    db.refresh(testimonial)
    return testimonial


@router.get("/testimonials/{course_code}", response_model=list[TestimonialOut])
def get_public_testimonials(
    course_code: str,
    db: Session = Depends(get_db),
):
    testimonials = (
        db.query(Testimonial)
        .filter(
            Testimonial.course_code == course_code,
            Testimonial.status == "APPROVED",
        )
        .order_by(desc(Testimonial.is_featured), desc(Testimonial.id))
        .limit(3)
        .all()
    )
    return testimonials


@router.get("/admin/testimonials/pending", response_model=list[TestimonialOut])
def get_pending_testimonials(db: Session = Depends(get_db)):
    testimonials = (
        db.query(Testimonial)
        .filter(Testimonial.status == "PENDING")
        .order_by(desc(Testimonial.id))
        .all()
    )
    return testimonials


@router.get("/admin/testimonials/approved", response_model=list[TestimonialOut])
def get_approved_testimonials(db: Session = Depends(get_db)):
    testimonials = (
        db.query(Testimonial)
        .filter(Testimonial.status == "APPROVED")
        .order_by(desc(Testimonial.is_featured), desc(Testimonial.id))
        .all()
    )
    return testimonials


@router.put("/admin/testimonials/{testimonial_id}/status", response_model=TestimonialOut)
def update_testimonial_status(
    testimonial_id: Annotated[int, Path(gt=0)],
    payload: TestimonialStatusUpdate,
    db: Session = Depends(get_db),
):
    testimonial = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if testimonial is None:
        raise HTTPException(status_code=404, detail="Testimonial not found")

    testimonial.status = payload.status
    if payload.status != "APPROVED":
        testimonial.is_featured = False

    db.commit()
    db.refresh(testimonial)
    return testimonial


@router.put("/admin/testimonials/{testimonial_id}/feature", response_model=TestimonialOut)
def update_testimonial_featured_flag(
    testimonial_id: Annotated[int, Path(gt=0)],
    payload: TestimonialFeatureUpdate,
    db: Session = Depends(get_db),
):
    testimonial = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if testimonial is None:
        raise HTTPException(status_code=404, detail="Testimonial not found")

    if payload.is_featured and testimonial.status != "APPROVED":
        raise HTTPException(
            status_code=400,
            detail="Only APPROVED testimonials can be featured",
        )

    testimonial.is_featured = payload.is_featured
    db.commit()
    db.refresh(testimonial)
    return testimonial
