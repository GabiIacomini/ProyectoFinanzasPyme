import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    x: -20,
    scale: 0.98,
  },
  enter: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

export default function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      className={`min-h-screen bg-background ${className}`}
    >
      {children}
    </motion.div>
  );
}
