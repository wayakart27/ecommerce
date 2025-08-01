"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { PropagateLoader } from "react-spinners";
import { motion } from "framer-motion";

export function VerificationAnimation({ state, errorMessage }) {
  // Animation variants for the container
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
  };

  // Animation for the success icon
  const bounceTransition = {
    y: {
      duration: 1,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    }
  };

  // Animation for the error icon
  const shakeTransition = {
    x: [-5, 5, -5, 5, 0],
    transition: { duration: 0.5 }
  };

  if (state === "loading") {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <PropagateLoader color="#3B82F6" size={15} />
        <motion.p 
          className="mt-4 text-center text-muted-foreground"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Verifying your email...
        </motion.p>
      </motion.div>
    );
  }

  if (state === "success") {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
          <motion.div
            animate={{ y: [-10, 0] }}
            transition={bounceTransition}
          >
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </motion.div>
        </div>
        <motion.p 
          className="mt-4 text-center text-green-600 font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Your email has been successfully verified!
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="flex flex-col items-center justify-center"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center">
        <motion.div
          animate={shakeTransition}
        >
          <XCircle className="h-16 w-16 text-red-600" />
        </motion.div>
      </div>
      <motion.p 
        className="mt-4 text-center text-red-600 font-medium"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Verification failed
      </motion.p>
      {errorMessage && (
        <motion.p 
          className="mt-4 text-center text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {errorMessage}
        </motion.p>
      )}
    </motion.div>
  );
}