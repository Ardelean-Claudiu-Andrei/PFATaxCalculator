import React from 'react';


const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} PFA Tax Calculator. Toate drepturile rezervate.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;