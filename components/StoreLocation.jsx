'use client';

import { Button } from "@/components/ui/button";
import { MapPin, Clock, ExternalLink, Phone, Mail } from "lucide-react";
import { motion } from "framer-motion";

const StoreLocation = () => {
  const openGoogleMaps = () => {
    window.open("https://www.google.com/maps/dir/?api=1&destination=11.75009,11.975028", "_blank");
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <section id="location" className="py-8 bg-white relative overflow-hidden">
      <div className="container px-4 md:px-6 relative">
        <motion.div 
          {...fadeInUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-blue-600 mb-6">
            Visit Our Tech Store
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Experience the latest gadgets and electronics at our physical store. Get hands-on with devices before you buy.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-white p-10 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-500">
              <div className="space-y-8">
                {/* Address Section */}
                <div className="flex items-start space-x-6">
                  <div className="h-14 w-14 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-200">
                    <MapPin className="h-7 w-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl text-gray-800 mb-3">Store Location</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      Shop No. 4 Farm Centre,
                      <br /> Kano, Nigeria
                      <br />
                    </p>
                  </div>
                </div>

                {/* Hours Section */}
                <div className="flex items-start space-x-6">
                  <div className="h-14 w-14 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-200">
                    <Clock className="h-7 w-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl text-gray-800 mb-3">Opening Hours</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-gray-500">Monday - Friday</div>
                      <div className="text-blue-600 font-medium">9:00 AM - 7:00 PM</div>
                      <div className="text-gray-500">Saturday</div>
                      <div className="text-blue-600 font-medium">10:00 AM - 6:00 PM</div>
                      <div className="text-gray-500">Sunday</div>
                      <div className="text-blue-600 font-medium">11:00 AM - 5:00 PM</div>
                    </div>
                  </div>
                </div>

                {/* Contact Section */}
                <div className="flex items-start space-x-6">
                  <div className="h-14 w-14 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-200">
                    <Phone className="h-7 w-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl text-gray-800 mb-3">Contact Us</h3>
                    <p className="text-blue-600 text-lg">08160126157, 08035318145</p>
                    <p className="text-gray-500 mt-2">wayakart27@gmail.com</p>
                  </div>
                </div>

                <Button 
                  onClick={openGoogleMaps}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl h-14 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2 mt-6"
                >
                  Get Directions
                  <ExternalLink className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="h-[600px] rounded-2xl overflow-hidden shadow-xl border border-blue-200 relative group"
          >
            <div className="absolute inset-0 bg-blue-50/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.3952841188984!2d11.975028!3d11.75009!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDQ1JzAwLjMyTCIxMcKwNTgnMzAuMSJF!5e0!3m2!1sen!2sus!4v1718000000000"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Wayakart Electronics Store Location"
              className="grayscale hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
            ></iframe>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default StoreLocation;