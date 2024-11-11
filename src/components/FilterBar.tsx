import React from 'react';
import { Category } from '../types';

const categories: Category[] = ['Just Chatting', 'Rust', 'GTA', 'Call of Duty'];

interface FilterBarProps {
  selectedCategory: Category | null;
  setSelectedCategory: (category: Category | null) => void;
  showLiveOnly: boolean;
  setShowLiveOnly: (show: boolean) => void;
}

export function FilterBar({
  selectedCategory,
  setSelectedCategory,
  showLiveOnly,
  setShowLiveOnly,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        onClick={() => setSelectedCategory(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium ${
          !selectedCategory
            ? 'bg-purple-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => setSelectedCategory(category)}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            selectedCategory === category
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          {category}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by</span>
        <button
          onClick={() => setShowLiveOnly(!showLiveOnly)}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            showLiveOnly
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          {showLiveOnly ? 'Live' : 'All'}
        </button>
      </div>
    </div>
  );
}