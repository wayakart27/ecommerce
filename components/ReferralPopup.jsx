'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, X, Share2, UserPlus, ShoppingCart, Banknote } from 'lucide-react'
import { getReferralSettings } from '@/actions/referral'

export function ReferralPopup() {
  const [isVisible, setIsVisible] = useState(false)
  const [settings, setSettings] = useState({
    minPayoutAmount: 1000,
    referralPercentage: 1.5
  })
  const popupRef = useRef(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await getReferralSettings()
        if (result?.success) {
          setSettings(result.data)
        }
        setTimeout(() => setIsVisible(true), 1500)
      } catch (error) {
        console.error('Error loading settings:', error)
        setTimeout(() => setIsVisible(true), 1500) // Show with defaults
      }
    }
    loadSettings()
  }, [])

  const handleClose = () => setIsVisible(false)
  const handleClickOutside = (e) => {
    if (popupRef.current && !popupRef.current.contains(e.target)) {
      handleClose()
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const minPayoutNaira = settings.minPayoutAmount

  const benefits = [
    {
      icon: <ShoppingCart className="h-5 w-5 text-purple-600" />,
      title: "First Order Bonus",
      description: `Earn ${settings.referralPercentage}% of your friend's initial purchase`
    },
    {
      icon: <Banknote className="h-5 w-5 text-purple-600" />,
      title: "Instant Bank Transfer",
      description: `Withdraw directly to your bank when you reach ₦${minPayoutNaira.toLocaleString()}`
    }
  ]

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-200 p-6"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-purple-100 p-2.5 rounded-full">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Refer & Earn Cash</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Get paid for every friend's first purchase
                </p>
              </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid gap-4 mb-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-purple-50 p-2 rounded-full">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{benefit.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* How It Works */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">HOW TO EARN</h4>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-600 text-sm font-medium">1</span>
                  <span className="text-sm text-gray-700">Share your unique referral link</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-600 text-sm font-medium">2</span>
                  <span className="text-sm text-gray-700">Friend makes their first purchase</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-600 text-sm font-medium">3</span>
                  <span className="text-sm text-gray-700">Earnings added to your balance</span>
                </li>
              </ol>
            </div>

            {/* Withdrawal Info */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Withdraw anytime:</span>
                <span className="text-sm font-semibold text-purple-600">
                  ₦{minPayoutNaira.toLocaleString()}+
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Direct bank transfers processed within 24 hours
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}