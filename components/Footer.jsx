import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer id="contact" className="bg-gray-900 pt-16 pb-10">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h3 className="text-2xl font-bold text-blue-400 mb-6">PureLuxury</h3>
            <p className="text-gray-300 mb-6">
              Your trusted destination for premium electronics - smartphones, laptops, and accessories 
              with genuine warranties and excellent customer service.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-blue-400 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-blue-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-blue-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xl text-blue-400 mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li><a href="/" className="text-gray-300 hover:text-blue-400 transition-colors">Home</a></li>
              <li><a href="#products" className="text-gray-300 hover:text-blue-400 transition-colors">Products</a></li>
              <li><a href="#categories" className="text-gray-300 hover:text-blue-400 transition-colors">Categories</a></li>
              <li><a href="#testimonials" className="text-gray-300 hover:text-blue-400 transition-colors">Reviews</a></li>
              <li><a href="#location" className="text-gray-300 hover:text-blue-400 transition-colors">Store Location</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl text-blue-400 mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">08160126157, 08035318145</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">pureluxury247@gmail.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">
                  Shop No. 8, Chilla Plaza, Along Gujba Road<br />
                  Damaturu, Yobe State Nigeria
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl text-blue-400 mb-6">Tech Updates</h3>
            <p className="text-gray-300 mb-4">
              Subscribe for the latest tech news, product launches, and exclusive deals.
            </p>
            <div className="flex">
              <Input
                type="email"
                placeholder="Your email"
                className="bg-gray-800 border-blue-400/50 focus:border-blue-400 text-gray-100 rounded-r-none focus-visible:ring-blue-400"
              />
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-l-none hover:shadow-lg hover:shadow-blue-400/20">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-gray-700">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} PureLuxury Electronics. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;