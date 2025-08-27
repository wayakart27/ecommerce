'use client';

import { Button } from "@/components/ui/button";
import { MapPin, Clock, ExternalLink, Phone, Mail, Navigation } from "lucide-react";
import { motion } from "framer-motion";

const StoreLocation = () => {
  const openGoogleMaps = () => {
    window.open("https://www.google.com/maps/dir/?api=1&destination=Farm+Centre+Kano+Nigeria", "_blank");
  };

  const openGoogleMapsDirections = () => {
    window.open("https://www.google.com/maps/dir//Farm+Centre+Kano+Nigeria", "_blank");
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <section id="location" className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200 rounded-full translate-x-1/3 translate-y-1/3 opacity-20"></div>
      
      <div className="container px-4 md:px-6 mx-auto relative z-10">
        <motion.div 
          {...fadeInUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Visit Our Store at Farm Centre Kano
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Experience the latest gadgets and electronics at our physical store. Get hands-on with devices before you make a purchase.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1"
          >
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="space-y-6 md:space-y-8">
                {/* Address Section */}
                <div className="flex items-start space-x-4 md:space-x-6">
                  <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 md:h-7 md:w-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2 md:mb-3">Store Location</h3>
                    <p className="text-gray-600 md:text-lg leading-relaxed">
                       No.7 Farm Centre,
                      <br /> Kano, Nigeria
                    </p>
                  </div>
                </div>

                {/* Hours Section */}
                <div className="flex items-start space-x-4 md:space-x-6">
                  <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 md:h-7 md:w-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2 md:mb-3">Opening Hours</h3>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      <div className="text-gray-500 text-sm md:text-base">Monday - Friday</div>
                      <div className="text-blue-600 font-medium text-sm md:text-base">9:00 AM - 7:00 PM</div>
                      <div className="text-gray-500 text-sm md:text-base">Saturday</div>
                      <div className="text-blue-600 font-medium text-sm md:text-base">10:00 AM - 6:00 PM</div>
                      <div className="text-gray-500 text-sm md:text-base">Sunday</div>
                      <div className="text-blue-600 font-medium text-sm md:text-base">11:00 AM - 5:00 PM</div>
                    </div>
                  </div>
                </div>

                {/* Contact Section */}
                <div className="flex items-start space-x-4 md:space-x-6">
                  <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 md:h-7 md:w-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2 md:mb-3">Contact Us</h3>
                    <p className="text-blue-600 md:text-lg font-medium">08160126157, 08035318145</p>
                    <div className="flex items-center mt-1 md:mt-2">
                      <Mail className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-gray-500 text-sm md:text-base">wayakart27@gmail.com</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                  <Button 
                    onClick={openGoogleMaps}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl h-12 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    View Map
                  </Button>
                  <Button 
                    onClick={openGoogleMapsDirections}
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 font-medium rounded-xl h-12 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Navigation className="h-4 w-4" />
                    Get Directions
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="h-80 md:h-96 lg:h-full rounded-2xl overflow-hidden shadow-xl border border-gray-200 relative group order-1 lg:order-2"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none"></div>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3900.223123456789!2d8.516997!3d12.002345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDAwJzA4LjQiTiA4wrAzMScwMS4yIkU!5e0!3m2!1sen!2sng!4v1651234567890!5m2!1sen!2sng"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Wayakart Electronics Store at Farm Centre Kano"
              className="group-hover:scale-105 transition-transform duration-700"
            ></iframe>
            
            <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md">
              <p className="text-xs font-medium text-gray-700">Farm Centre, Kano</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default StoreLocation;