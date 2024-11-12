import React, { useState } from 'react';
import RequestCard from './RequestCard';
import { CollabRequest } from '../models/CollabRequest';

export function RequestsList() {
  const [requests, setRequests] = useState<CollabRequest[]>([]);

  const handleRequestDelete = (deletedRequestId: string) => {
    // Remove the deleted request from the state
    setRequests(prevRequests => 
      prevRequests.filter(request => request.id !== deletedRequestId)
    );
  };

  return (
    <div>
      {requests.map(request => (
        <RequestCard 
          key={request.id} 
          request={request}
          onDelete={() => handleRequestDelete(request.id)}
        />
      ))}
    </div>
  );
} 