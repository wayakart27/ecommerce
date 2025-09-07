'use client';

import { Shield, Truck, Headphones, Star, Zap, CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    id: 1,
    title: "Premium Devices",
    description: "Only genuine, high-quality phones, laptops, and accessories from top brands.",
    icon: <Star className="h-6 w-6 text-blue-600" />,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    hoverColor: "hover:bg-blue-100",
    details: ["Genuine products", "Top brands", "Quality assurance"]
  },
  {
    id: 2,
    title: "Secure Payments",
    description: "Shop with confidence using our secure payment options and encryption.",
    icon: <Shield className="h-6 w-6 text-green-600" />,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    hoverColor: "hover:bg-green-100",
    details: ["SSL encryption", "Paystack payment", "Secure checkout"]
  },
  {
    id: 3,
    title: "Fast Delivery",
    description: "Quick shipping Nationwide, Nigeria.",
    icon: <Truck className="h-6 w-6 text-orange-600" />,
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
    hoverColor: "hover:bg-orange-100",
    details: ["Nationwide delivery", "Fast processing", "Tracking available"]
  },
  {
    id: 4,
    title: "Tech Support",
    description: "Dedicated customer support for all your technical questions.",
    icon: <Headphones className="h-6 w-6 text-purple-600" />,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    hoverColor: "hover:bg-purple-100",
    details: ["24/7 support", "Technical assistance", "Warranty support"]
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200 rounded-full translate-x-1/3 translate-y-1/3 opacity-20"></div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 px-4 py-2 rounded-full mb-4">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Why Choose Us</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Experience the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">PureLuxury</span> Difference
          </h2>
          <p className="text-gray-600 text-lg">
            Your trusted destination for premium electronics and exceptional service
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              <div className={`bg-white rounded-2xl p-6 border border-gray-200 hover:border-transparent transition-all duration-300 h-full flex flex-col shadow-sm hover:shadow-xl ${feature.hoverColor}`}>
                {/* Icon with gradient background */}
                <div className={`mb-6 w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors">
                  {feature.title}
                </h3>
                
                {/* Description */}
                <p className="text-gray-600 mb-4 flex-1">
                  {feature.description}
                </p>
                
                {/* Feature details */}
                <div className="space-y-2 mb-6">
                  {feature.details.map((detail, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">{detail}</span>
                    </div>
                  ))}
                </div>
                
                {/* Learn more link */}
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors mt-auto">
                  <span>Learn more</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
                
                {/* Hover effect border */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 -z-10`}></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-12 border-t border-gray-200"
        >
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">500+</div>
            <div className="text-gray-600 text-sm md:text-base">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">4.9/5</div>
            <div className="text-gray-600 text-sm md:text-base">Customer Rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">24/7</div>
            <div className="text-gray-600 text-sm md:text-base">Support Available</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">100%</div>
            <div className="text-gray-600 text-sm md:text-base">Genuine Products</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;