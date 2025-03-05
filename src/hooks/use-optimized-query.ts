
import { useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type OptimizedQueryOptions<TData, TError> = Omit<
  UseQueryOptions<TData, TError, TData, unknown[]>,
  "queryKey" | "queryFn"
> & {
  errorMessage?: string;
  meta?: {
    onError?: (error: TError) => void;
  };
};

export function useOptimizedQuery<TData, TError>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options?: OptimizedQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  const { toast } = useToast();
  const { errorMessage = "An error occurred while fetching data", meta, ...queryOptions } = options || {};

  return useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes (default is 0)
    gcTime: 10 * 60 * 1000, // 10 minutes (default is 5 minutes)
    retry: 2, // Retry failed requests twice (default is 3)
    refetchOnWindowFocus: false, // Disable automatic refetching when window regains focus (default is true)
    ...queryOptions,
    meta: {
      ...meta,
    },
    onError: (error) => {
      console.error(`Query error (${queryKey.join('/')}):`, error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (meta?.onError) {
        meta.onError(error);
      }
    },
  });
}
