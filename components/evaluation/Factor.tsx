'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FactorGroup {
  id: string;
  name: string;
  code: string;
  orderIndex: number;
  dimensions: any[]; // Simplified for this component
}

interface FactorProps {
  factor: FactorGroup;
  isCurrent: boolean;
  onClick: () => void;
  completedCount: number;
  totalCount: number;
}

export const FactorComponent = ({
  factor,
  isCurrent,
  onClick,
  completedCount,
  totalCount,
}: FactorProps) => (
  <motion.div layout className="relative space-y-1 p-1">
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm font-medium'
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="truncate">{factor.name}</span>
      </div>
      <Badge variant="secondary" className="shrink-0 text-xs">
        {completedCount}/{totalCount}
      </Badge>
    </button>
    {isCurrent && (
      <motion.div
        layoutId="activeFactorBorder"
        className="absolute inset-0 border border-primary rounded-md pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      />
    )}
  </motion.div>
);






