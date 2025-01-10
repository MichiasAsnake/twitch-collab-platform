import React from 'react';
import { useStore } from '../store';
import { useCreateRequest } from '../hooks/useRequests';
import { useTwitchCategories } from '../hooks/useTwitchCategories';
import { getCategoryColor } from '../utils/categoryColors';
import { TOP_LANGUAGES } from '../utils/languages';
import ReactCountryFlag from 'react-country-flag';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NewRequestFormProps {
  onClose: () => void;
}

function ScrollContainer({ children }: { children: React.ReactNode }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  
  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 360;
      const newScrollLeft = direction === 'left' 
        ? containerRef.current.scrollLeft - scrollAmount
        : containerRef.current.scrollLeft + scrollAmount;
      
      containerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });

      // Check scroll position after animation
      setTimeout(checkScroll, 100);
    }
  };

  return (
    <div className="relative flex items-center -mx-8">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute left-4 z-10 p-1 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}
      
      <div 
        ref={containerRef}
        className="flex gap-6 overflow-x-hidden scroll-smooth mx-16 py-2 scrollbar-none w-full"
        onScroll={checkScroll}
      >
        {children}
      </div>
      
      <button
        type="button"
        onClick={() => scroll('right')}
        className="absolute right-4 z-10 p-1 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  );
}

export function NewRequestForm({ onClose }: NewRequestFormProps) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = React.useState<string | null>(null);
  const { data: categories = [] } = useTwitchCategories();
  const createRequest = useCreateRequest();
  const { user } = useStore();

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, category];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      console.error('No user found');
      return;
    }

    try {
      console.log('Creating request with user:', user);
      await createRequest.mutateAsync({
        title,
        description,
        categories: selectedCategories,
        language: selectedLanguage || 'en',
        userId: user.id,
        user: {
          id: user.id,
          login: user.login,
          displayName: user.displayName,
          profileImageUrl: user.profileImageUrl,
          isLive: user.isLive || false,
          category: user.category || '',
          title: user.title || ''
        }
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Categories (select up to 3)
        </label>
        <div className="mt-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
          <div className="flex flex-wrap gap-2 p-1">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategoryChange(category.name)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategories.includes(category.name)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Language
        </label>
        <ScrollContainer>
          {TOP_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setSelectedLanguage(lang.code === selectedLanguage ? null : lang.code)}
              className={`relative group`}
            >
              <div className={`
                w-12 h-8.5 rounded-md overflow-hidden transition-transform duration-200 
                ${selectedLanguage === lang.code 
                  ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' 
                  : 'hover:scale-110'
                }
              `}>
                <ReactCountryFlag
                  countryCode={lang.countryCode}
                  svg
                  className="w-full h-full object-fill"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '100%'
                  }}
                />
              </div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {lang.name}
                </span>
              </div>
            </button>
          ))}
        </ScrollContainer>
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
          disabled={createRequest.isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-[#9146FF] rounded-lg hover:bg-[#7c2cff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={createRequest.isPending}
        >
          {createRequest.isPending ? 'Creating...' : 'Create Request'}
        </button>
      </div>
    </form>
  );
}