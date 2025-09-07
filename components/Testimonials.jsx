'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, ArrowLeft, ArrowRight, Quote, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    id: 1,
    name: "Muhammad Ali",
    role: "Tech Enthusiast",
    stars: 5,
    content:
      "PureLuxury has the best selection of smartphones in Nigeria. I got my latest flagship phone here at a great price with genuine warranty. Highly recommended!",
  },
  {
    id: 2,
    name: "Amina Ibrahim",
    role: "Business Owner",
    stars: 5,
    content:
      "We've purchased multiple laptops for our office from PureLuxury. Their after-sales support is excellent and the products always arrive in perfect condition.",
  },
  {
    id: 3,
    name: "Kolawole Adebayo",
    role: "Student",
    stars: 4,
    content:
      "Found the perfect budget laptop for my studies. PureLuxury's delivery was faster than expected and the product works perfectly. Will shop here again!",
  },
  {
    id: 4,
    name: "Chioma Nwosu",
    role: "Graphic Designer",
    stars: 5,
    content:
      "The MacBook Pro I bought from PureLuxury transformed my workflow. Their customer service helped me choose the perfect specs for my design work.",
  },
  {
    id: 5,
    name: "Emeka Okonkwo",
    role: "Gamer",
    stars: 5,
    content:
      "Finally a store that stocks high-end gaming laptops in Nigeria! My new machine runs all the latest games smoothly. Legit products with proper documentation.",
  },
  {
    id: 6,
    name: "Fatima Bello",
    role: "Software Developer",
    stars: 5,
    content:
      "As a developer, I need reliable hardware. PureLuxury delivered exactly what I needed with competitive pricing and excellent customer support.",
  }
];

const Testimonials = () => {
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    setStartIndex((prev) => (prev > 0 ? prev - 1 : testimonials.length - visibleCount));
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setStartIndex((prev) => (prev + 1 <= testimonials.length - visibleCount ? prev + 1 : 0));
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setVisibleCount(3);
      } else if (window.innerWidth >= 768) {
        setVisibleCount(2);
      } else {
        setVisibleCount(1);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setStartIndex((prev) => (prev + 1 <= testimonials.length - visibleCount ? prev + 1 : 0));
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, visibleCount]);

  const visibleTestimonials = testimonials.slice(
    startIndex,
    startIndex + visibleCount
  );

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200 rounded-full translate-x-1/3 translate-y-1/3 opacity-20"></div>
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 px-4 py-2 rounded-full mb-4"
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Customer Stories</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4 text-gray-900"
          >
            Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Tech Enthusiasts</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-600 text-lg"
          >
            Discover why thousands of customers choose PureLuxury for their tech needs
          </motion.p>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
              {visibleTestimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group border border-gray-100 hover:border-blue-200"
                  onMouseEnter={() => setIsAutoPlaying(false)}
                  onMouseLeave={() => setIsAutoPlaying(true)}
                >
                  <div className="absolute top-4 right-4 text-blue-100 transform transition-transform duration-300 group-hover:scale-110">
                    <Quote size={48} />
                  </div>
                  
                  <div className="flex items-center mb-6 relative z-10">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md">
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full p-1 shadow-md">
                        <Star className="w-3 h-3 text-white fill-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {testimonial.name}
                      </h4>
                      <p className="text-blue-500 text-sm font-medium">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex mb-4 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < 4 ? "mr-1" : ""} ${
                          i < testimonial.stars ? "fill-yellow-400" : "text-gray-200"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-500 font-medium">
                      {testimonial.stars}.0
                    </span>
                  </div>

                  <p className="text-gray-600 leading-relaxed relative z-10 text-sm md:text-base">
                    "{testimonial.content}"
                  </p>

                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {/* Navigation dots */}
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: testimonials.length - visibleCount + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setStartIndex(index);
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === startIndex 
                    ? 'bg-blue-600 w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          <div className="flex justify-center mt-8 space-x-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-300 transform hover:scale-105 shadow-md"
              onClick={handlePrevious}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-300 transform hover:scale-105 shadow-md"
              onClick={handleNext}
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-8 border-t border-gray-200"
        >
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">500+</div>
            <div className="text-gray-600">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">4.9/5</div>
            <div className="text-gray-600">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">1000+</div>
            <div className="text-gray-600">Products Sold</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">24/7</div>
            <div className="text-gray-600">Customer Support</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;