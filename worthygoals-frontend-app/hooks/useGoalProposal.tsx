import { useCallback, useState } from 'react';
import { GoalProposal } from '@/models';
import { goalsApiService } from '@/services/goals.service';

export function useGoalProposal() {
  const [proposal, setProposal] = useState<GoalProposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const propose = useCallback(async (raw: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await goalsApiService.propose(raw);
      setProposal(result);
      return result;
    } catch {
      setError('Could not generate a proposal. You can still fill in the details manually.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProposal(null);
    setError(null);
  }, []);

  return { proposal, loading, error, propose, reset };
}
