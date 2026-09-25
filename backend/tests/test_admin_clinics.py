"""Admin clinic create / edit / delete and the public directory, on SQLite with Medplum faked."""

import sys
from datetime import date
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models import *  # noqa: F401,F403 — register every table
from app.models.clinicModel import CliniModel
from app.models.doctorClinicModel import DoctorClinicModel
from app.models.doctorModel import DoctorProfile
from app.models.enumModel import Status
from app.models.userModel import UserModel
from app.schemas.clinic import ClinicBase, ClinicUpdate
from app.services.adminService import AdminService, ClinicNotFoundError
from app.services.clinicService import CliniService


class FakeMedplum:
    def __init__(self):
        self.calls = []

    def create_organisation(self, clinic):
        self.calls.append(("create", clinic.name))
        return {"id": f"org-{len(self.calls)}"}

    def update_organisation(self, organisation_id, clinic):
        self.calls.append(("update", organisation_id, clinic.name))

    def delete_resource(self, resource_type, resource_id):
        self.calls.append(("delete", resource_type, resource_id))


@pytest.fixture
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


@pytest.fixture
def admin(db):
    service = AdminService(db)
    service.medplum = FakeMedplum()
    return service


def add_doctor(db, clinic, status=Status.APPROVED, name="Asha"):
    user = UserModel(first_name=name, last_name="Rao", email=f"{name}@example.com", number=name,
                     hashed_password="x", date_of_birth=date(1985, 1, 1), is_active=True)
    db.add(user)
    db.flush()
    profile = DoctorProfile(user_id=user.id, specialization="Cardiology", license_number=f"L-{name}",
                            status=status, clinic_id=clinic.id)
    db.add(profile)
    db.flush()
    db.add(DoctorClinicModel(doctor_profile_id=profile.id, clinic_id=clinic.id,
                             medplum_practitioner_role_id=f"role-{name}"))
    db.commit()
    return profile


def new_clinic(admin, name="City Care"):
    return admin.create_clinic(ClinicBase(name=name, picture="https://img/x.png", address="MG Road"))


def test_create_rejects_duplicate_name_case_insensitively(admin):
    new_clinic(admin)
    with pytest.raises(ValueError):
        new_clinic(admin, "city care")


def test_update_changes_medplum_first_then_row(admin):
    clinic = new_clinic(admin)
    updated = admin.update_clinic(clinic.id, ClinicUpdate(name="City Care Plus", phone=""))
    assert updated.name == "City Care Plus" and updated.phone is None
    assert admin.medplum.calls[-1] == ("update", clinic.medplum_organisation_id, "City Care Plus")


def test_update_rejects_taking_another_clinics_name(admin):
    new_clinic(admin, "One")
    two = new_clinic(admin, "Two")
    with pytest.raises(ValueError):
        admin.update_clinic(two.id, ClinicUpdate(name="ONE"))


def test_update_replacing_uploaded_picture_deletes_the_old_one(admin):
    clinic = admin.create_clinic(ClinicBase(name="Pic", picture="clinics/old.png"))
    with patch("app.services.adminService.delete_key") as delete_key:
        admin.update_clinic(clinic.id, ClinicUpdate(picture="clinics/new.png"))
    delete_key.assert_called_once_with("clinics/old.png")


def test_delete_unlinks_doctors_and_cleans_up_medplum(db, admin):
    clinic = new_clinic(admin)
    profile = add_doctor(db, clinic)
    org_id = clinic.medplum_organisation_id
    admin.delete_clinic(clinic.id)
    assert db.query(CliniModel).count() == 0
    assert db.query(DoctorClinicModel).count() == 0
    db.refresh(profile)
    assert profile.clinic_id is None
    assert ("delete", "PractitionerRole", "role-Asha") in admin.medplum.calls
    assert ("delete", "Organization", org_id) in admin.medplum.calls


def test_missing_clinic_is_not_found(admin):
    with pytest.raises(ClinicNotFoundError):
        admin.delete_clinic("not-a-uuid")


def test_directory_and_admin_list_show_only_approved_doctors(db, admin):
    clinic = new_clinic(admin)
    add_doctor(db, clinic, Status.APPROVED, "Asha")
    add_doctor(db, clinic, Status.PENDING, "Ravi")
    directory = CliniService(db).directory()
    assert [d["name"] for d in directory[0]["doctors"]] == ["Dr. Asha Rao"]
    assert "medplum_organisation_id" not in directory[0]
    assert [d.name for d in admin.list_clinics()[0].doctors] == ["Dr. Asha Rao"]
