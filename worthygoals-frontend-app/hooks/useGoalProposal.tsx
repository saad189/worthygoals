import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { GoalProposal } from '@/models';
import { goalsApiService } from '@/services/goals.service';

export function useGoalProposal() {
  const [proposal, setProposal] = useState<GoalProposal | null>(null);

  const mutation = useMutation({
    mutationFn: (raw: string) => goalsApiService.propose(raw),
    onSuccess: (result) => setProposal(result),
  });

  const propose = useCallback(
    (raw: string) => mutation.mutateAsync(raw).catch(() => null),
    [mutation],
  );

  const reset = useCallback(() => {
    setProposal(null);
    mutation.reset();
  }, [mutation]);

  return {
    proposal,
    loading: mutation.isPending,
    error: mutation.isError
      ? 'Could not generate a proposal. You can still fill in the details manually.'
      : null,
    propose,
    reset,
  };
}
