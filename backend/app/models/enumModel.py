import enum


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class AppointmentStatus(str,enum.Enum):
    SCHEDULED = "scheduled"
    RESCHEDULED = "rescheduled"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class ConsultationStatus(str,enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ConsultationTrigger(str, enum.Enum):
    AUTO_ESCALATION = "auto_escalation"
    MANUAL_BOOKING = "manual_booking"

class DayOfWeek(str, enum.Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"
 
 
class TimeSlot(str, enum.Enum):
    AM = "am"  
    PM = "pm"  

class FamilyRelationship(str, enum.Enum):
    MOTHER = "mother"
    FATHER = "father"
    SON = "son"
    DAUGHTER = "daughter"
    BROTHER = "brother"
    SISTER = "sister"
    HUSBAND = "husband"
    WIFE = "wife"
    GRANDMOTHER = "grandmother"
    GRANDFATHER = "grandfather"
    GRANDSON = "grandson"
    GRANDDAUGHTER = "granddaughter"
    UNCLE = "uncle"
    AUNT = "aunt"
    NEPHEW = "nephew"
    NIECE = "niece"
    COUSIN = "cousin"
    OTHER = "other"