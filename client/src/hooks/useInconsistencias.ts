import { trpc } from '@/lib/trpc';

export function useInconsistencias(date: string) {
  const { data: inconsistencias, isLoading, error, refetch } = trpc.attendance.getInconsistencias.useQuery(
    { date },
    { enabled: !!date }
  );

  return {
    inconsistencias: inconsistencias || [],
    isLoading,
    error,
    refetch
  };
}
