from app.core.config import settings
from app.utils.integration.medplum.index import MedplumIntegration


def get_medplum_integration() -> MedplumIntegration:
    return MedplumIntegration(
        base_url=settings.MEDPLUM_BASE_URL,
        client_id=settings.MEDPLUM_CLIENT_ID,
        client_secret=settings.MEDPLUM_CLIENT_SECRET,
        project_id=settings.MEDPLUM_PROJECT_ID,
    )
