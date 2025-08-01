'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  // Phones
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1920&auto=format",
    title: "Premium Smartphones",
    subtitle: "Unmatched performance and stunning displays",
    cta: "View Collection"
  },
   {
    id: 2,
    image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?q=80&w=1920&auto=format",
    title: "Flagship Smartphones",
    subtitle: "Experience the latest mobile technology from top brands",
    cta: "Shop Phones"
  },
  
  // Laptops
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=1920&auto=format",
    title: "Ultrabooks & Laptops",
    subtitle: "Powerful computing for work and creativity",
    cta: "Browse Laptops"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=1920&auto=format",
    title: "Gaming Laptops",
    subtitle: "Extreme performance for gamers and creators",
    cta: "Explore Gaming"
  },
  
  // Accessories
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1920&auto=format",
    title: "Wireless Earbuds",
    subtitle: "Premium sound quality with crystal clear audio",
    cta: "Shop Audio"
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1920&auto=format",
    title: "Smart Watches",
    subtitle: "Stay connected and track your fitness",
    cta: "View Wearables"
  },
  {
    id: 8,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=1920&auto=format",
    title: "Complete Your Setup",
    subtitle: "All the accessories you need in one place",
    cta: "Shop Accessories"
  }
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHoveringNav, setIsHoveringNav] = useState(false);

  useEffect(() => {
    if (!isHoveringNav) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev === slides.length - 1 ? 0 : prev + 1));
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [isHoveringNav]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        onMouseEnter={() => setIsHoveringNav(true)}
        onMouseLeave={() => setIsHoveringNav(false)}
        className="absolute left-8 top-1/2 z-20 -translate-y-1/2 transform rounded-full bg-black/30 p-2 text-white hover:bg-white/20 transition-all hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
      </button>
      <button
        onClick={nextSlide}
        onMouseEnter={() => setIsHoveringNav(true)}
        onMouseLeave={() => setIsHoveringNav(false)}
        className="absolute right-8 top-1/2 z-20 -translate-y-1/2 transform rounded-full bg-black/30 p-2 text-white hover:bg-white/20 transition-all hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
      </button>

      <AnimatePresence mode="wait">
        {slides.map((slide, index) => (
          currentSlide === index && (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0"
            >
              <motion.img
                src={slide.image}
                alt={slide.title}
                className="absolute inset-0 h-full w-full object-cover"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 6 }}
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="container px-8 md:px-12 lg:px-24">
                  <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.7 }}
                    className="max-w-2xl space-y-4"
                  >
                    <motion.h1 
                      className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
                    >
                      {slide.title}
                    </motion.h1>
                    <motion.p 
                      className="text-lg md:text-xl text-white/90 font-medium max-w-lg"
                    >
                      {slide.subtitle}
                    </motion.p>
                    <motion.div 
                      className="flex flex-wrap gap-4 pt-8"
                    >
                      <Button 
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-sm px-8 py-5 transition-all duration-300 group font-medium tracking-wider hover:shadow-lg hover:scale-[1.02]"
                      >
                        {slide.cta}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )
        ))}
      </AnimatePresence>

      <div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20"
        onMouseEnter={() => setIsHoveringNav(true)}
        onMouseLeave={() => setIsHoveringNav(false)}
      >
        {slides.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => goToSlide(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentSlide === index 
                ? "bg-white w-6" 
                : "bg-white/40 w-3 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Hero;