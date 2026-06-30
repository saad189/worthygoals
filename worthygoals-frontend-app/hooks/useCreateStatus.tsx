import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { statusApiService } from '@/services/status.service';
import { StatusPost } from '@/models';

/**
 * Post a status to the team. On success the three mentor reactions come back in
 * the response and the feed is invalidated so the new post (with its polyphonic
 * replies) appears at the top.
 */
export function useCreateStatus(onSuccess?: (post: StatusPost) => void) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (text: string) => statusApiService.create(text),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['status'] });
      onSuccess?.(post);
    },
  });

  const post = useCallback(
    (text: string) => {
      mutation.mutate(text);
    },
    [mutation],
  );

  return {
    post,
    submitting: mutation.isPending,
    error: mutation.isError ? 'Could not post. Try again.' : null,
  };
}
