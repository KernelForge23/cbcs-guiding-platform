def refresh_testimonial_averages(
    course: dict, testimonials_for_course: list[dict]
) -> dict:
    if len(testimonials_for_course) < 3:
        return course

    overwrite_fields = [
        ("prior_knowledge_score", "prior_knowledge_reported"),
        ("difficulty_score", "difficulty_reported"),
        ("workload_score", "workload_reported"),
    ]

    source = course.setdefault("source", {})
    for score_field, testimonial_field in overwrite_fields:
        average_value = sum(
            float(testimonial[testimonial_field])
            for testimonial in testimonials_for_course
        ) / len(testimonials_for_course)
        course[score_field] = average_value
        source[score_field.replace("_score", "")] = "testimonial_averaged"

    return course
