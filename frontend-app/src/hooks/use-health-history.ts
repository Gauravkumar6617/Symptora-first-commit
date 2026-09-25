import { useMemo } from 'react';

import { useChecks } from '@/hooks/use-queries';
import { useHealthCheckStore } from '@/store/healthCheckStore';
import type { RiskCheck, SymptomCheck } from '@/types';

/** A saved symptom-checker result in the shape the history screens show. */
function toRiskCheck(check: SymptomCheck): RiskCheck {
  const top = check.predictions[0];
  const symptoms = check.symptoms.map((s) => s.label).join(', ');
  return {
    id: check.id,
    title: top ? `Possible ${top.label}` : 'Symptom check',
    riskLevel: check.urgency,
    createdAt: check.created_at,
    // The match percentage takes the score slot (the questionnaire uses 0–100 too).
    score: top ? Math.round(top.probability * 100) : undefined,
    summary: check.is_mine ? symptoms : `${symptoms} · run by ${check.run_by_name}`,
    forMember: check.about_me ? undefined : check.subject_name,
  };
}

/**
 * Health history, newest first: symptom checks saved on the server (shared
 * with family) plus questionnaire Health Checks kept on this device.
 */
export function useHealthHistory() {
  const local = useHealthCheckStore((state) => state.checks);
  const server = useChecks();
  const checks = useMemo(
    () =>
      [...(server.data ?? []).map(toRiskCheck), ...local].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    [server.data, local],
  );
  return { checks, refetch: server.refetch, isLoading: server.isLoading };
}
