import { Variants } from 'framer-motion';

/**
 * Fade/scale transition for auth <-> lobby page changes
 * Creates a smooth "breathing" effect
 */
export const fadeScaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 1.05,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

/**
 * Zoom-in transition for lobby -> game space
 * Creates a dramatic "entering the world" effect
 */
export const zoomInVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 1.2,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};
