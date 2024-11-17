import React from 'react';
import { RequestCard } from './RequestCard';
import { useRequests, useDeleteRequest } from '../hooks/useRequests';
import { Category } from '../types';
import { useQueryClient } from 'react-query';
import { socket } from '../lib/socket';
import { updateUserLiveStatus } from '../api';

interface RequestGridProps {
  selectedCategory: Category | null;
  showLiveOnly: boolean;
  selectedLanguage: string | null;
}

export function RequestGrid({ selectedCategory, showLiveOnly, selectedLanguage }: RequestGridProps) {
  const { data: requests = [], isLoading, error } = useRequests();
  const deleteRequestMutation = useDeleteRequest();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const handleStatusUpdate = async ({ userId, isLive }: { userId: string, isLive: boolean }) => {
      // Update database
      await updateUserLiveStatus(userId, isLive);
      
      // Update local cache
      queryClient.setQueryData(['requests'], (oldRequests: any[] = []) => 
        oldRequests.map((request) => 
          request.user.id === userId 
            ? {
                ...request,
                user: {
                  ...request.user,
                  isLive,
                }
              }
            : request
        )
      );
    };

    socket.on('statusUpdate', handleStatusUpdate);
    return () => {
      socket.off('statusUpdate', handleStatusUpdate);
    };
  }, [queryClient]);

  const requestKey = React.useMemo(() => 
    requests.map(r => r.id).join(','), 
    [requests]
  );

  const filteredRequests = React.useMemo(() => {
    return requests.filter((request) => {
      if (selectedCategory && !request.categories.includes(selectedCategory)) return false;
      if (showLiveOnly && !request.user.isLive) return false;
      if (selectedLanguage && request.language !== selectedLanguage) return false;
      return true;
    });
  }, [requests, selectedCategory, showLiveOnly, selectedLanguage]);

  React.useEffect(() => {
    console.log('RequestGrid rendered with', filteredRequests.length, 'requests');
  }, [filteredRequests]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading requests</div>;
  }

  return (
    <div className="overflow-x-hidden w-full">
      <div className="max-w-[2000px] mx-auto px-10 py-8">
        <div 
          key={requestKey}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8"
        >
          {filteredRequests.map((request) => (
            <RequestCard 
              key={`${request.id}-${request.categories.length}`}
              request={request}
              onDelete={() => deleteRequestMutation.mutate(request.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}