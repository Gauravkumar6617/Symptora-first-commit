"""One-off dev seed: a couple of clinics, a few approved doctors, and the
services they offer — enough real data to exercise booking, telemedicine and
the Medplum sync end to end. Safe to re-run; anything that already exists
(by clinic name / doctor email / service name) is skipped.

Goes through the same service classes (AdminService, DoctorService,
DoctorClinicService) the app itself uses, so it creates the same real
Medplum Organization/Practitioner/PractitionerRole records a real signup +
admin-approval flow would.

Usage: cd backend && source .venv/bin/activate && python -m scripts.seed_demo_data
"""
import sys
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import SessionLocal
from app.repositories.userRepositories import UserRepository
from app.schemas.clinic import ClinicBase
from app.schemas.clinic_availability import ClinicAvailabilityCreate
from app.schemas.doctor import DoctorProfileCreate, DoctorProfileUpdate
from app.schemas.doctor_availability import DoctorAvailabilityCreate
from app.schemas.service import ServiceCreate
from app.schemas.userSchema import UserCreate
from app.services.adminService import AdminService
from app.services.doctorClinicService import DoctorClinicService
from app.services.doctorService import DoctorService

FAKE_ADMIN = SimpleNamespace(is_admin=True)
WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"]
WEEK_SLOTS = [{"days": d, "slot": s} for d in WEEKDAYS for s in ("am", "pm")]

CLINICS = [
    {
        "name": "City Care Multispecialty",
        "picture": "https://images.unsplash.com/photo-1587351021355-a479a299d2f9?w=800",
        "description": "A multispecialty clinic in the city center.",
        "address": "12 MG Road, Bengaluru",
        "phone": "080-4000-1000",
        "opening_hours": "Mon-Sat, 9am-7pm",
    },
    {
        "name": "Sunrise Family Clinic",
        "picture": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800",
        "description": "Neighbourhood family clinic focused on everyday care.",
        "address": "45 Park Street, Pune",
        "phone": "020-2500-2000",
        "opening_hours": "Mon-Sat, 10am-6pm",
    },
]

DOCTORS = [
    {
        "email": "asha.rao@symptora.demo", "first_name": "Asha", "last_name": "Rao",
        "specialization": "Cardiology", "license_number": "DL-CARD-001",
        "fee": 800, "years_of_practice": 12, "languages": "English, Hindi",
        "clinics": ["City Care Multispecialty"],
    },
    {
        "email": "rohan.mehta@symptora.demo", "first_name": "Rohan", "last_name": "Mehta",
        "specialization": "Dermatology", "license_number": "DL-DERM-002",
        "fee": 600, "years_of_practice": 8, "languages": "English, Hindi, Marathi",
        "clinics": ["City Care Multispecialty"],
    },
    {
        "email": "neha.sharma@symptora.demo", "first_name": "Neha", "last_name": "Sharma",
        "specialization": "General Physician", "license_number": "DL-GP-003",
        "fee": 400, "years_of_practice": 6, "languages": "English, Hindi",
        "clinics": ["City Care Multispecialty", "Sunrise Family Clinic"],
    },
    {
        "email": "kabir.singh@symptora.demo", "first_name": "Kabir", "last_name": "Singh",
        "specialization": "Pediatrics", "license_number": "DL-PED-004",
        "fee": 500, "years_of_practice": 10, "languages": "English, Punjabi",
        "clinics": ["Sunrise Family Clinic"],
    },
]

SERVICES = [
    {"name": "Cardiology Consultation", "specialization": "Cardiology", "fee": 800,
     "description": "Heart health check and consultation."},
    {"name": "Skin & Dermatology Checkup", "specialization": "Dermatology", "fee": 600,
     "description": "Skin, hair and nail concerns."},
    {"name": "General Health Checkup", "specialization": "General Physician", "fee": 400,
     "description": "Routine checkup for common symptoms."},
    {"name": "Child Wellness Visit", "specialization": "Pediatrics", "fee": 500,
     "description": "Growth, vaccination and general pediatric care."},
]

DEMO_PASSWORD = "Demo@12345"


def seed_clinics(db) -> dict[str, str]:
    admin = AdminService(db)
    ids: dict[str, str] = {}
    for data in CLINICS:
        existing = admin.clinic_repo.get_by_name(data["name"])
        if existing:
            print(f"  clinic already exists: {data['name']}")
            ids[data["name"]] = existing.id
            continue
        clinic = admin.create_clinic(ClinicBase(
            **data,
            availability_slots=[ClinicAvailabilityCreate(**s) for s in WEEK_SLOTS],
        ))
        print(f"  created clinic: {clinic.name}")
        ids[data["name"]] = clinic.id
    return ids


def seed_doctors(db, clinic_ids: dict[str, str]) -> None:
    users = UserRepository(db)
    doctors = DoctorService(db)
    links = DoctorClinicService(db)
    admin = AdminService(db)

    for i, data in enumerate(DOCTORS):
        user = users.get_user_by_email(data["email"])
        if user and user.id_doctor:
            print(f"  doctor already exists: {data['email']}")
            continue

        if not user:
            user = users.create_user(
                UserCreate(
                    first_name=data["first_name"],
                    last_name=data["last_name"],
                    email=data["email"],
                    number=f"98765{43000 + i:05d}",
                    date_of_birth=datetime(1985, 1, 1),
                    password=DEMO_PASSWORD,
                ),
                is_active=True,
            )

        profile = doctors.get_my_application(user.id)
        if not profile:
            profile = doctors.apply_to_become_doctor(user.id, DoctorProfileCreate(
                specialization=data["specialization"],
                license_number=data["license_number"],
            ))
        if profile.status.value != "approved":
            profile = doctors.approve_doctor(FAKE_ADMIN, profile.id)

        admin.update_doctor(profile.id, DoctorProfileUpdate(
            fee=data["fee"],
            years_of_practice=data["years_of_practice"],
            languages=data["languages"],
            availability_slots=[DoctorAvailabilityCreate(**s) for s in WEEK_SLOTS],
        ))

        for clinic_name in data["clinics"]:
            clinic_id = clinic_ids[clinic_name]
            try:
                links.admin_assign_doctor_to_clinic(profile.id, clinic_id)
            except ValueError:
                pass  # already linked

        print(f"  ready: Dr. {data['first_name']} {data['last_name']} ({data['specialization']})")


def seed_services(db) -> None:
    admin = AdminService(db)
    for data in SERVICES:
        if admin.service_repo.get_by_name(data["name"]):
            print(f"  service already exists: {data['name']}")
            continue
        admin.create_service(ServiceCreate(**data))
        print(f"  created service: {data['name']}")


def main() -> None:
    db = SessionLocal()
    try:
        print("Clinics:")
        clinic_ids = seed_clinics(db)
        print("Doctors:")
        seed_doctors(db, clinic_ids)
        print("Services:")
        seed_services(db)
        print(f"\nDone. Every seeded doctor logs in with password: {DEMO_PASSWORD}")
        print("Doctor logins: " + ", ".join(d["email"] for d in DOCTORS))
    finally:
        db.close()


if __name__ == "__main__":
    main()
