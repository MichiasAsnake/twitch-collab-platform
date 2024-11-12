export function RequestGrid({ selectedCategory, showLiveOnly }: RequestGridProps) {
  const { data: requests = [], isLoading, error } = useRequests();
  const deleteRequestMutation = useDeleteRequest();

  const filteredRequests = React.useMemo(() => {
    return requests.filter((request) => {
      if (selectedCategory && request.category !== selectedCategory) return false;
      if (showLiveOnly && !request.user.isLive) return false;
      return true;
    });
  }, [requests, selectedCategory, showLiveOnly]);

  const handleDelete = React.useCallback((deletedId: string) => {
    deleteRequestMutation.mutate(deletedId);
  }, [deleteRequestMutation]);

  // ... rest of the component remains the same ...
} 