import React from 'react';
import { Category } from '../types';
import { useTwitchCategories } from '../hooks/useTwitchCategories';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TOP_LANGUAGES } from '../utils/languages';
import ReactCountryFlag from 'react-country-flag';

interface FilterBarProps {
  selectedCategory: Category | null;
  setSelectedCategory: (category: Category | null) => void;
  showLiveOnly: boolean;
  setShowLiveOnly: (show: boolean) => void;
  selectedLanguage: string | null;
  setSelectedLanguage: (language: string | null) => void;
}

const CATEGORY_COLORS = [
  'bg-blue-50/50 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-500/30',
  'bg-purple-50/50 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-200 dark:border-purple-500/30',
  'bg-pink-50/50 text-pink-700 border border-pink-200 dark:bg-pink-500/20 dark:text-pink-200 dark:border-pink-500/30',
  'bg-indigo-50/50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-500/30',
  'bg-green-50/50 text-green-700 border border-green-200 dark:bg-green-500/20 dark:text-green-200 dark:border-green-500/30',
  'bg-red-50/50 text-red-700 border border-red-200 dark:bg-red-500/20 dark:text-red-200 dark:border-red-500/30',
  'bg-orange-50/50 text-orange-700 border border-orange-200 dark:bg-orange-500/20 dark:text-orange-200 dark:border-orange-500/30',
  'bg-teal-50/50 text-teal-700 border border-teal-200 dark:bg-teal-500/20 dark:text-teal-200 dark:border-teal-500/30',
];

const getCategoryColor = (category: string) => {
  const index = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
};

export function FilterBar({
  selectedCategory,
  setSelectedCategory,
  showLiveOnly,
  setShowLiveOnly,
  selectedLanguage,
  setSelectedLanguage,
}: FilterBarProps) {
  const { data: categories = [], isLoading } = useTwitchCategories();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [showAllCategories, setShowAllCategories] = React.useState(false);
  
  const INITIAL_CATEGORIES_SHOWN = 29;
  const visibleCategories = showAllCategories ? categories : categories.slice(0, INITIAL_CATEGORIES_SHOWN);

  if (isLoading) {
    return <div>Loading categories...</div>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-start w-full max-w-none px-2">
        <div className="flex items-start flex-1 mr-4">
          <div className={`flex flex-wrap gap-2 gap-y-3 items-center transition-all duration-500 ease-in-out ${
            showAllCategories ? 'max-h-[1000px] opacity-100' : 'max-h-[84px] opacity-100'
          } overflow-hidden will-change-[max-height]`}>
            {visibleCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name === selectedCategory ? null : category.name)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                  selectedCategory === category.name
                    ? 'bg-indigo-600 text-white border border-indigo-400'
                    : `${getCategoryColor(category.name)}`
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 shrink-0">
          {categories.length > INITIAL_CATEGORIES_SHOWN && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="px-3 py-1.5 rounded-md text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
            >
              {showAllCategories ? (
                <>
                  Show Less <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Show More <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          <div className="flex items-center gap-5 -ml-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Sort by</span>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 min-w-[120px] justify-between shadow-sm"
              >
                <span className="text-sm">
                  {selectedLanguage 
                    ? TOP_LANGUAGES.find(l => l.code === selectedLanguage)?.name 
                    : showLiveOnly 
                      ? 'Live Only' 
                      : 'All'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full mt-1 w-[200px] rounded-md bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="py-1">
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      View
                    </div>
                    <button
                      onClick={() => {
                        setShowLiveOnly(false);
                        setSelectedLanguage(null);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-1.5 text-sm ${
                        !showLiveOnly && !selectedLanguage
                          ? 'text-indigo-600 dark:text-indigo-400' 
                          : 'text-gray-700 dark:text-gray-300'
                      } hover:bg-gray-50 dark:hover:bg-gray-700`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        setShowLiveOnly(true);
                        setSelectedLanguage(null);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-1.5 text-sm ${
                        showLiveOnly && !selectedLanguage
                          ? 'text-indigo-600 dark:text-indigo-400' 
                          : 'text-gray-700 dark:text-gray-300'
                      } hover:bg-gray-50 dark:hover:bg-gray-700`}
                    >
                      Live Only
                    </button>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Language
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      {TOP_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setSelectedLanguage(lang.code === selectedLanguage ? null : lang.code);
                            setShowLiveOnly(false);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-1.5 text-sm flex items-center gap-2 ${
                            selectedLanguage === lang.code
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-gray-700 dark:text-gray-300'
                          } hover:bg-gray-50 dark:hover:bg-gray-700`}
                        >
                          <ReactCountryFlag
                            countryCode={lang.countryCode}
                            svg
                            className="w-5 h-4 object-contain rounded-sm"
                          />
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}