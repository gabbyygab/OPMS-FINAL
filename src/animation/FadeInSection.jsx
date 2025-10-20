import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

function FadeInSection({ children, delay = 0 }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 1.05, y: 40 }}
      animate={
        isVisible
          ? { opacity: 1, scale: 1, y: 0 } // fade in
          : { opacity: 0, scale: 1.05, y: 40 } // fade out
      }
      transition={{ duration: 0.8, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

export default FadeInSection;
