'use client'; // Required for animations

import Link from 'next/link';
import { motion } from 'framer-motion';
import Head from 'next/head';

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Page Not Found | WayaKart Store</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden p-8 text-center"
        >
          <div className="mb-6">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                repeat: Infinity, 
                repeatType: "mirror", 
                duration: 2 
              }}
            >
              <svg
                className="w-24 h-24 mx-auto text-rose-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </motion.div>
          </div>

          <h1 className="text-4xl font-bold text-gray-800 mb-3">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              Return Home
            </Link>
          </motion.div>

          <div className="mt-8 text-sm text-gray-500">
            <p>Need help? <a href="/contact" className="text-blue-600 hover:underline">Contact us</a></p>
          </div>
        </motion.div>
      </div>
    </>
  );
}