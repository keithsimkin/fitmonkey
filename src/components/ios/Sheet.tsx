import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Right-side action in the sheet header (e.g. "Done"). */
  action?: ReactNode;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, action, children }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-hidden rounded-t-3xl bg-white pb-safe shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.35)] dark:bg-surface-dark"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose();
            }}
          >
            <div className="flex justify-center pt-2">
              <div className="h-1.5 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            </div>
            {(title || action) && (
              <div className="flex items-center justify-between px-4 py-3">
                <h3 className="text-[17px] font-semibold">{title}</h3>
                {action}
              </div>
            )}
            <div className="no-scrollbar max-h-[80vh] overflow-y-auto px-4 pb-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
