"use client";

import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";

interface AnimatedCardProps {
  children: React.ReactNode;
  index: number;
  staggerDelay?: number;
}

export function AnimatedCard({
  children,
  index,
  staggerDelay = 0.06,
}: AnimatedCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {

        if (entry.isIntersecting) {
          setIsInView(true);
        } else {
          setIsInView(false);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.88,
      filter: "blur(8px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.7,
        delay: index * staggerDelay,
        type: "spring" as const,
        stiffness: 90,
        damping: 20,
      },
    },
  };

  const hoverVariants = {
    rest: {
      y: 0,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      scale: 1,
    },
    hover: {
      y: -4,
      boxShadow: "0 12px 28px rgba(217,119,6,0.18)",
      scale: 1.015,
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="h-full"
    >
      <motion.div
        className="h-full rounded-xl overflow-hidden bg-white cursor-pointer"
        variants={hoverVariants}
        initial="rest"
        animate={isHovering ? "hover" : "rest"}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

