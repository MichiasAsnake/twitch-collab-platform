import React from 'react';
import { useStore } from '../store';
import { useCreateRequest } from '../hooks/useRequests';

interface NewRequestFormProps {
  onClose: () => void;
}

export function NewRequestForm({ onClose }: NewRequestFormProps) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState('Just Chatting');
  const createRequest = useCreateRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createRequest.mutateAsync({
        title,
        description,
        category,
      });
      onClose();
    } catch (error) {
      console.error('Failed to create request:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-[#9146FF] dark:focus:border-[#bf94ff] focus:outline-none focus:ring-1 focus:ring-[#9146FF] dark:focus:ring-[#bf94ff]"
          placeholder="e.g., Looking for Rust duo partner"
          required
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-[#9146FF] dark:focus:border-[#bf94ff] focus:outline-none focus:ring-1 focus:ring-[#9146FF] dark:focus:ring-[#bf94ff]"
        >
          <option>Just Chatting</option>
          <option>Rust</option>
          <option>GTA</option>
          <option>Call of Duty</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-[#9146FF] dark:focus:border-[#bf94ff] focus:outline-none focus:ring-1 focus:ring-[#9146FF] dark:focus:ring-[#bf94ff]"
          placeholder="Describe what kind of collaboration you're looking for..."
          required
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          disabled={createRequest.isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-[#9146FF] rounded-lg hover:bg-[#7c2cff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={createRequest.isLoading}
        >
          {createRequest.isLoading ? 'Creating...' : 'Create Request'}
        </button>
      </div>
    </form>
  );
}