'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, ArrowLeft, ArrowRight, Quote, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    id: 1,
    name: "Muhammad Ali",
    role: "Tech Enthusiast",
    stars: 5,
    content:
      "Wayakart has the best selection of smartphones in Nigeria. I got my latest flagship phone here at a great price with genuine warranty. Highly recommended!",
  },
  {
    id: 2,
    name: "Amina Ibrahim",
    role: "Business Owner",
    stars: 5,
    content:
      "We've purchased multiple laptops for our office from Wayakart. Their after-sales support is excellent and the products always arrive in perfect condition.",
  },
  {
    id: 3,
    name: "Kolawole Adebayo",
    role: "Student",
    stars: 4,
    content:
      "Found the perfect budget laptop for my studies. Wayakart's delivery was faster than expected and the product works perfectly. Will shop here again!",
  },
  {
    id: 4,
    name: "Chioma Nwosu",
    role: "Graphic Designer",
    stars: 5,
    content:
      "The MacBook Pro I bought from Wayakart transformed my workflow. Their customer service helped me choose the perfect specs for my design work.",
  },
  {
    id: 5,
    name: "Emeka Okonkwo",
    role: "Gamer",
    stars: 5,
    content:
      "Finally a store that stocks high-end gaming laptops in Nigeria! My new machine runs all the latest games smoothly. Legit products with proper documentation.",
  },
];

const Testimonials = () => {
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

  const handlePrevious = () => {
    setStartIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleNext = () => {
    setStartIndex((prev) =>
      prev + visibleCount < testimonials.length ? prev + 1 : prev
    );
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setVisibleCount(3);
      } else if (window.innerWidth >= 640) {
        setVisibleCount(2);
      } else {
        setVisibleCount(1);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const visibleTestimonials = testimonials.slice(
    startIndex,
    startIndex + visibleCount
  );

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-blue-600">
            What Our Customers Say
          </h2>
          <p className="text-gray-600 text-lg">
            Hear from tech enthusiasts and professionals who trust Wayakart for their electronics needs
          </p>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleTestimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group border border-blue-100 hover:border-blue-200"
                >
                  <div className="absolute top-4 right-4 text-blue-100 transform transition-transform duration-300 group-hover:scale-110">
                    <Quote size={48} />
                  </div>
                  
                  <div className="flex items-center mb-6 relative z-10">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-blue-50 border-2 border-dashed border-blue-200 flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
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
                        className={`h-4 w-4 ${
                          i < testimonial.stars ? "fill-yellow-400" : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-gray-600 leading-relaxed relative z-10">
                    "{testimonial.content}"
                  </p>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          <div className="flex justify-center mt-12 space-x-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-300 transform hover:scale-105"
              onClick={handlePrevious}
              disabled={startIndex === 0}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-300 transform hover:scale-105"
              onClick={handleNext}
              disabled={startIndex + visibleCount >= testimonials.length}
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;