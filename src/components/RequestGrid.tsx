import React, { useMemo } from 'react';
import { RequestCard } from './RequestCard';
import { useRequests, useDeleteRequest } from '../hooks/useRequests';
import { Category } from '../types';
import { useQueryClient } from 'react-query';
import { socket } from '../lib/socket';
import { updateUserLiveStatus } from '../api';
import { useStreamersStatus } from '../hooks/useStreamersStatus';

interface RequestGridProps {
  selectedCategory: Category | null;
  showLiveOnly: boolean;
  selectedLanguage: string | null;
}

export function RequestGrid({ selectedCategory, showLiveOnly, selectedLanguage }: RequestGridProps) {
  const { data: requests = [], isLoading, error } = useRequests();
  const deleteRequestMutation = useDeleteRequest();
  const queryClient = useQueryClient();

  // Get all unique user IDs from all requests
  const userIds = useMemo(() => 
    [...new Set(requests.map(request => request.user.id))], 
    [requests]
  );
  
  // Single status subscription for all streamers
  const { data: streamersStatus = [] } = useStreamersStatus(userIds);

  // Add the requestKey memo
  const requestKey = useMemo(() => 
    requests.map(r => r.id).join(','), 
    [requests]
  );

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const isLive = streamersStatus.find(status => status.userId === request.user.id)?.isLive || false;
      
      if (selectedCategory && !request.categories.includes(selectedCategory)) return false;
      if (showLiveOnly && !isLive) return false;
      if (selectedLanguage && request.language !== selectedLanguage) return false;
      return true;
    });
  }, [requests, streamersStatus, selectedCategory, showLiveOnly, selectedLanguage]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading requests</div>;

  return (
    <div className="overflow-x-hidden w-full">
      <div className="max-w-[2000px] mx-auto px-10 py-8">
        <div 
          key={requestKey}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8"
        >
          {filteredRequests.map((request) => (
            <RequestCard 
              key={request.id}
              request={request}
              isLive={streamersStatus.find(status => status.userId === request.user.id)?.isLive || false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}