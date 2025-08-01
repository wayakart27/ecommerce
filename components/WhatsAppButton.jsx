'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";

const WhatsAppButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const phoneNumber = "2348160126157";
  const message = "Hello! I'm interested in your products.";

  const openWhatsAppChat = () => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed bottom-20 right-6 z-40 sm:bottom-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl shadow-2xl p-6 mb-4 w-80 relative bg-white border border-gray-200"
          >
            <div className="absolute -top-2 -right-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4 text-gray-600" />
              </Button>
            </div>

            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <FaWhatsapp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">Chat with us</h3>
                <p className="text-gray-500 text-sm">Typically replies instantly</p>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-6">
              Have questions about our products? We're here to help!
            </p>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={openWhatsAppChat}
            >
              <FaWhatsapp className="mr-2 h-5 w-5" />
              Start Chat on WhatsApp
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        {!isOpen && (
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
            className="absolute inset-0 z-0 rounded-full bg-green-600"
          />
        )}
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="icon"
            className="h-16 w-16 rounded-full shadow-lg bg-green-600 hover:bg-green-700 relative z-10"
            onClick={() => setIsOpen(!isOpen)}
          >
            <FaWhatsapp className="h-7 w-7 text-white" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default WhatsAppButton;