"""Domain-only helpers. Database entities are read from raw SQL result rows."""

DEPARTMENT_CODES = {
    "01": "Civil Engineering",
    "02": "Mechanical Engineering",
    "03": "Electrical Engineering",
    "04": "Computer Science & Engineering",
    "05": "Electronics & Communication Engineering",
    "06": "Chemical Engineering",
    "07": "Architecture",
    "08": "Business Administration",
    "09": "English",
    "10": "Mathematics & Physics",
}


def derive_department(student_id: str) -> str:
    return (
        DEPARTMENT_CODES.get(student_id[2:4], f"Department {student_id[2:4]}")
        if len(student_id) >= 4
        else "Unknown"
    )
