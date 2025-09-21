'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, ArrowLeft, ArrowRight, Quote, User, Sparkles, Smartphone, Laptop, Headphones } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    id: 1,
    name: "Muhammad Ali",
    role: "Tech Enthusiast",
    stars: 5,
    product: "Samsung Galaxy S23 Ultra",
    content:
      "The Samsung Galaxy S23 Ultra I bought from PureLuxury is absolutely phenomenal! The camera quality is unmatched, and the S Pen functionality is a game-changer. Genuine product with full warranty.",
    avatar: "MA",
  },
  {
    id: 2,
    name: "Amina Ibrahim",
    role: "Business Owner",
    stars: 5,
    product: "iPhone 14 Pro Max",
    content:
      "Upgraded my entire team to iPhone 14 Pro Max from PureLuxury. The seamless integration with our MacBooks has boosted productivity by 30%. Their bulk purchase discount was incredible!",
    avatar: "AI",
  },
  {
    id: 3,
    name: "Kolawole Adebayo",
    role: "Student",
    stars: 5,
    product: "Samsung Galaxy Tab S8",
    content:
      "My Samsung tablet from PureLuxury is perfect for lectures and note-taking. The battery lasts all day, and the display is crystal clear. Best investment for my education!",
    avatar: "KA",
  },
  {
    id: 4,
    name: "Chioma Nwosu",
    role: "Graphic Designer",
    stars: 5,
    product: "MacBook Pro 16-inch",
    content:
      "The MacBook Pro I bought from PureLuxury transformed my design workflow. The M2 Pro chip handles 4K video editing effortlessly. Their customer service helped me choose the perfect specs.",
    avatar: "CN",
  },
  {
    id: 5,
    name: "Emeka Okonkwo",
    role: "Content Creator",
    stars: 5,
    product: "iPhone 15 Pro",
    content:
      "The cinematic mode on my new iPhone 15 Pro from PureLuxury has elevated my content quality. The ProRes video recording is studio-quality. Fast delivery and authentic Apple product!",
    avatar: "EO",
  },
  {
    id: 6,
    name: "Fatima Bello",
    role: "Software Developer",
    stars: 5,
    product: "Samsung Z Fold 5",
    content:
      "The Fold 5 is a programming dream! I can multitask with IDE on one screen and documentation on the other. PureLuxury had the best price and included a free protective case.",
    avatar: "FB",
  },
  {
    id: 7,
    name: "Tunde Okafor",
    role: "Photographer",
    stars: 5,
    product: "Samsung S23+",
    content:
      "The 200MP camera on my Samsung S23+ captures stunning details. Low-light performance is incredible. PureLuxury's next-day delivery got it to me before an important shoot!",
    avatar: "TO",
  },
  {
    id: 8,
    name: "Ngozi Eze",
    role: "Entrepreneur",
    stars: 5,
    product: "iPhone 14",
    content:
      "My iPhone 14 from PureLuxury has been incredibly reliable. The battery life gets me through my longest days. Their installment payment plan made it affordable without compromising quality.",
    avatar: "NE",
  },
  {
    id: 9,
    name: "Segun Adeyemi",
    role: "Gaming Enthusiast",
    stars: 5,
    product: "Samsung Odyssey G9",
    content:
      "The 49-inch curved gaming monitor I got from PureLuxury is mind-blowing! Immersive doesn't even begin to describe it. They had the best price and included warranty coverage.",
    avatar: "SA",
  },
  {
    id: 10,
    name: "Bisi Adeola",
    role: "Travel Blogger",
    stars: 5,
    product: "iPhone 13 Pro",
    content:
      "Even though it's an older model, my iPhone 13 Pro from PureLuxury takes breathtaking travel photos. The Night mode is perfect for capturing cityscapes. Authentic product at a great price!",
    avatar: "BA",
  },
  {
    id: 11,
    name: "Chinedu Okoro",
    role: "Music Producer",
    stars: 5,
    product: "Samsung Buds2 Pro",
    content:
      "The noise cancellation on these Samsung earbuds is studio-quality. Perfect for mixing tracks on the go. PureLuxury had a bundle deal with my Galaxy phone that saved me 25%!",
    avatar: "CO",
  },
  {
    id: 12,
    name: "Zainab Lawal",
    role: "Medical Student",
    stars: 5,
    product: "iPad Pro 12.9-inch",
    content:
      "My iPad Pro from PureLuxury is perfect for studying anatomy. The large screen displays detailed diagrams clearly, and Apple Pencil support makes note-taking efficient. Best investment!",
    avatar: "ZL",
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

  // Generate random colors for avatars
  const avatarColors = [
    "bg-blue-500", "bg-green-500", "bg-purple-500", 
    "bg-pink-500", "bg-orange-500", "bg-teal-500",
    "bg-red-500", "bg-indigo-500", "bg-amber-500"
  ];

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
            Discover why thousands of customers choose PureLuxury for their Samsung and Apple needs
          </motion.p>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
              {visibleTestimonials.map((testimonial, index) => {
                const colorIndex = testimonial.id % avatarColors.length;
                const bgColor = avatarColors[colorIndex];
                
                return (
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
                        <div className={`w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md flex items-center justify-center text-white font-semibold text-lg ${bgColor}`}>
                          {testimonial.avatar}
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

                    <div className="mb-3">
                      <div className="inline-flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                        <Smartphone className="h-3 w-3 mr-1" />
                        {testimonial.product}
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
                );
              })}
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
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">2,500+</div>
            <div className="text-gray-600">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">4.9/5</div>
            <div className="text-gray-600">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">5,000+</div>
            <div className="text-gray-600">Products Sold</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">24/7</div>
            <div className="text-gray-600">Customer Support</div>
          </div>
        </motion.div>

        {/* Brand highlights */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Featured Brands Our Customers Love</h3>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
                </svg>
              </div>
              <span className="font-semibold text-gray-700">Apple</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.5 6.5l-1.5 1.5-3-3 1.5-1.5c.4-.4 1-.4 1.4 0l1.6 1.6c.4.4.4 1 0 1.4zM3.5 14.5l10-10 3 3-10 10-3-3z"/>
                </svg>
              </div>
              <span className="font-semibold text-gray-700">Samsung</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Laptop className="w-8 h-8 text-blue-600" />
              </div>
              <span className="font-semibold text-gray-700">Laptops</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Headphones className="w-8 h-8 text-blue-600" />
              </div>
              <span className="font-semibold text-gray-700">Accessories</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;