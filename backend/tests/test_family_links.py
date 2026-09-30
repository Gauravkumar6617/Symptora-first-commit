"""Linking a family profile to someone's own account needs their approval —
linking shares health checks both ways. Removal keeps visit records."""

import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models import *  # noqa: F401,F403 — register every table
from app.models.symptomCheckModel import SymptomCheckModel
from app.schemas.family_member import FamilyMemberCreate
from app.schemas.telemedicine import TelemedicineStart
from app.services.familyMemberService import FamilyMemberNotFoundError, FamilyMemberService
from app.services.notificationService import list_for_user
from app.services.symptomCheckService import SymptomCheckService
from app.services.telemedicineService import TelemedicineService


@pytest.fixture
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


def user(db, first, email, number):
    u = UserModel(first_name=first, last_name="X", email=email, number=number, hashed_password="x",
                  date_of_birth=date(1990, 1, 1), is_active=True)
    db.add(u)
    db.commit()
    return u


def private_check(db, owner, member=None):
    check = SymptomCheckModel(created_by_id=owner.id, family_member_id=member.id if member else None,
                              subject_name="x", symptoms=["anxiety"], predictions=[], urgency="low",
                              urgency_reasons=[])
    db.add(check)
    db.commit()
    return check


def test_adding_someones_email_does_not_expose_their_checks(db):
    stranger, victim = user(db, "Stranger", "s@x.com", "1"), user(db, "Victim", "victim@x.com", "2")
    private_check(db, victim)
    service = FamilyMemberService(db)
    member = service.add_member(stranger, FamilyMemberCreate(full_name="Anyone", date_of_birth=date(1990, 1, 1),
                                                             email="victim@x.com"))
    assert service.send_invite(stranger, member.id) == "requested"
    assert member.linked_user_id is None
    assert SymptomCheckService(db, None).visible_to(stranger) == []
    # the victim is asked instead, and sees the pending request
    assert "wants to add you as family" in list_for_user(db, victim.id)[0].title
    assert service.links_for_user(victim)[0]["status"] == "pending"


def test_accepting_shares_checks_and_declining_stops_it(db):
    owner, mum = user(db, "Owner", "o@x.com", "1"), user(db, "Mum", "mum@x.com", "2")
    private_check(db, mum)
    service = FamilyMemberService(db)
    member = service.add_member(owner, FamilyMemberCreate(full_name="Mum X", date_of_birth=date(1960, 1, 1),
                                                          email="mum@x.com"))
    service.accept_link(mum, member.id)
    assert len(SymptomCheckService(db, None).visible_to(owner)) == 1
    assert service.links_for_user(mum)[0]["status"] == "linked"

    service.decline_link(mum, member.id)  # leave
    assert SymptomCheckService(db, None).visible_to(owner) == []
    assert service.links_for_user(mum) == []  # email cleared: the request doesn't come back


def test_only_the_invited_person_can_accept(db):
    owner, mum, other = user(db, "Owner", "o@x.com", "1"), user(db, "Mum", "mum@x.com", "2"), user(db, "Other", "z@x.com", "3")
    service = FamilyMemberService(db)
    member = service.add_member(owner, FamilyMemberCreate(full_name="Mum X", date_of_birth=date(1960, 1, 1),
                                                          email="mum@x.com"))
    with pytest.raises(FamilyMemberNotFoundError):
        service.accept_link(other, member.id)


def test_remove_deletes_checks_but_keeps_visit_records(db):
    owner = user(db, "Owner", "o@x.com", "1")
    service = FamilyMemberService(db)
    kid = service.add_member(owner, FamilyMemberCreate(full_name="Kid X", date_of_birth=date(2018, 1, 1)))
    private_check(db, owner, kid)
    service.remove_member(owner, kid.id)
    assert db.query(SymptomCheckModel).count() == 0  # not left behind as the owner's own check

    kid2 = service.add_member(owner, FamilyMemberCreate(full_name="Kid Y", date_of_birth=date(2018, 1, 1)))
    TelemedicineService(db).start(owner, TelemedicineStart(reason="Fever", family_member_id=kid2.id))
    with pytest.raises(ValueError, match="can't be removed"):
        service.remove_member(owner, kid2.id)
