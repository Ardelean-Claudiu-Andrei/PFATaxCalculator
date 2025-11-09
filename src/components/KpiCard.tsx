import React from 'react';
import { motion } from 'framer-motion';

interface KpiCardProps {
  title: string;
  value: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, sublabel, icon }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        {icon && <div className="text-blue-600 dark:text-yellow-500">{icon}</div>}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900 dark:text-white break-words">{value}</p>
        {sublabel && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{sublabel}</p>
        )}
      </div>
    </motion.div>
  );
};

export default KpiCard;