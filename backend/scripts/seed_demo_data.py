"""One-off dev seed: clinics, approved doctors, the services they offer, and
two demo patients with a finished video consultation — enough real data to exercise booking, telemedicine and
the Medplum sync end to end. Safe to re-run; anything that already exists
(by clinic name / doctor email / service name) is skipped.

Goes through the same service classes (AdminService, DoctorService,
DoctorClinicService) the app itself uses, so it creates the same real
Medplum Organization/Practitioner/PractitionerRole records a real signup +
admin-approval flow would.

Usage: cd backend && source .venv/bin/activate && python -m scripts.seed_demo_data
"""
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from app.core.database import SessionLocal
from app.models import (
    FamilyMemberModel, MessageModel, NotificationModel, PrescriptionModel, TelemedicineConsultationModel,
)
from app.models.enumModel import ConsultationStatus
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
        "name": "Lakeside Health Centre",
        "picture": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800",
        "description": "Outpatient centre with diagnostics and women's health.",
        "address": "8 Lake View Road, Hyderabad",
        "phone": "040-3300-3000",
        "opening_hours": "Mon-Sun, 8am-8pm",
    },
    {
        "name": "Greenleaf Wellness Clinic",
        "picture": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800",
        "description": "Mental health, ENT and dental care under one roof.",
        "address": "221 Anna Salai, Chennai",
        "phone": "044-2800-4000",
        "opening_hours": "Mon-Sat, 9am-6pm",
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
    {
        "email": "priya.nair@symptora.demo", "first_name": "Priya", "last_name": "Nair",
        "specialization": "Gynecologist", "license_number": "DL-GYN-005",
        "fee": 700, "years_of_practice": 14, "languages": "English, Malayalam, Hindi",
        "clinics": ["Lakeside Health Centre"],
    },
    {
        "email": "arjun.reddy@symptora.demo", "first_name": "Arjun", "last_name": "Reddy",
        "specialization": "ENT Specialist", "license_number": "DL-ENT-006",
        "fee": 550, "years_of_practice": 9, "languages": "English, Telugu",
        "clinics": ["Lakeside Health Centre", "Greenleaf Wellness Clinic"],
    },
    {
        "email": "meera.iyer@symptora.demo", "first_name": "Meera", "last_name": "Iyer",
        "specialization": "Psychiatrist", "license_number": "DL-PSY-007",
        "fee": 900, "years_of_practice": 11, "languages": "English, Tamil",
        "clinics": ["Greenleaf Wellness Clinic"],
    },
    {
        "email": "vikram.das@symptora.demo", "first_name": "Vikram", "last_name": "Das",
        "specialization": "Dentist", "license_number": "DL-DEN-008",
        "fee": 450, "years_of_practice": 7, "languages": "English, Bengali, Hindi",
        "clinics": ["Greenleaf Wellness Clinic"],
    },
]

PATIENTS = [
    {"email": "ananya.patel@symptora.demo", "first_name": "Ananya", "last_name": "Patel"},
    {"email": "rahul.verma@symptora.demo", "first_name": "Rahul", "last_name": "Verma"},
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
    {"name": "Women's Health Consultation", "specialization": "Gynecologist", "fee": 700,
     "description": "Periods, pregnancy planning and routine women's health."},
    {"name": "Ear, Nose & Throat Checkup", "specialization": "ENT Specialist", "fee": 550,
     "description": "Sinus, hearing, throat and allergy concerns."},
    {"name": "Mental Wellness Session", "specialization": "Psychiatrist", "fee": 900,
     "description": "Stress, anxiety, sleep and mood support."},
    {"name": "Dental Checkup & Cleaning", "specialization": "Dentist", "fee": 450,
     "description": "Routine dental exam, cleaning and advice."},
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


def seed_patients(db) -> None:
    """Demo patients with a family member and one finished, paid video
    consultation (chat + prescription + notifications) so the dashboards,
    bell and PDF download have something to show. Skipped if the patient exists."""
    users = UserRepository(db)
    doctor_user = users.get_user_by_email("neha.sharma@symptora.demo")
    doctor = doctor_user.doctor_profile if doctor_user else None
    now = datetime.now(timezone.utc)

    for i, data in enumerate(PATIENTS):
        if users.get_user_by_email(data["email"]):
            print(f"  patient already exists: {data['email']}")
            continue
        patient = users.create_user(
            UserCreate(**data, number=f"91234{56000 + i:05d}", date_of_birth=datetime(1992, 6, 15),
                       password=DEMO_PASSWORD),
            is_active=True,
        )
        db.add(FamilyMemberModel(account_owner_id=patient.id, full_name=f"Kavya {data['last_name']}",
                                 relationship_to_owner="Daughter", date_of_birth=datetime(2017, 3, 2),
                                 gender="female"))
        if doctor:
            c = TelemedicineConsultationModel(
                patient_id=patient.id, doctor_profile_id=doctor.id, reason="Fever and sore throat for 2 days",
                status=ConsultationStatus.COMPLETED, amount=settings.TELEMEDICINE_FEE,
                payment_ref=f"test_seed_{i}", paid_at=now - timedelta(days=2),
            )
            db.add(c)
            db.flush()
            chat = [
                (doctor_user.id, "Hi, I've reviewed your notes. Any cough or trouble breathing?"),
                (patient.id, "A mild cough, no trouble breathing."),
                (doctor_user.id, "Sounds viral. I've sent a prescription; rest and fluids. Message me if the fever lasts beyond 3 days."),
            ]
            db.add_all(MessageModel(consultation_id=c.id, sender_id=who, body=body) for who, body in chat)
            db.add(PrescriptionModel(
                consultation_id=c.id, doctor_profile_id=doctor.id, patient_id=patient.id,
                medications=[
                    {"name": "Paracetamol 500mg", "dosage": "1 tablet", "frequency": "every 6 hours if fever",
                     "duration": "3 days", "instructions": "After food"},
                    {"name": "Warm saline gargle", "dosage": "1 glass", "frequency": "3 times a day",
                     "duration": "5 days", "instructions": None},
                ],
                notes="Rest, plenty of fluids. Seek care if breathing gets difficult.",
            ))
            db.add_all([
                NotificationModel(user_id=patient.id, title="Dr. Neha Sharma sent you a prescription",
                                  body="2 medication(s). Download it from your dashboard.", link="/dashboard#prescriptions"),
                NotificationModel(user_id=patient.id, title="New message from Dr. Neha Sharma",
                                  body=chat[-1][1][:140], link=f"/dashboard?chat=telemedicine:{c.id}"),
            ])
        db.commit()
        print(f"  created patient: {data['first_name']} {data['last_name']}")


def main() -> None:
    db = SessionLocal()
    try:
        print("Clinics:")
        clinic_ids = seed_clinics(db)
        print("Doctors:")
        seed_doctors(db, clinic_ids)
        print("Services:")
        seed_services(db)
        print("Patients:")
        seed_patients(db)
        print(f"\nDone. Every seeded account logs in with password: {DEMO_PASSWORD}")
        print("Doctor logins: " + ", ".join(d["email"] for d in DOCTORS))
        print("Patient logins: " + ", ".join(p["email"] for p in PATIENTS))
    finally:
        db.close()


if __name__ == "__main__":
    main()
