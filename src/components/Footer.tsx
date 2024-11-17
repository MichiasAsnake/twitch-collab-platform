import { Github, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 dark:text-white">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div>© 2024</div>
          <div className="flex gap-4">
            <Github className="w-5 h-5" />
            <Twitter className="w-5 h-5" />
          </div>
        </div>
      </div>
    </footer>
  );
} 