import React from 'react';
import { useStore } from '../store';

interface RequestCardProps {
  request: CollabRequest;
  onDelete: () => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, onDelete }) => {
  const user = useStore((state) => state.user);

  const isOwner = React.useMemo(() => {
    return user?.id === request.user.id;
  }, [user?.id, request.user.id]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      await deleteRequest(request.id);
      setShowDeleteModal(false);
      onDelete();
    } catch (error) {
      console.error('Error deleting request:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete request');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    // Your existing code here
  );
};

export default RequestCard; 