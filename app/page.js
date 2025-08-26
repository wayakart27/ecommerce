import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import Testimonials from "@/components/Testimonials";
import StoreLocation from "@/components/StoreLocation";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import Features from "@/components/Features";
import { ReferralPopup } from "@/components/ReferralPopup";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <FeaturedProducts />
      <Features />
      <Testimonials />
      <StoreLocation />
      <Footer />
      <WhatsAppButton />
      
      {/* Add the popup near root but not within any scrolling containers */}
      <ReferralPopup />
    </div>
  );
}