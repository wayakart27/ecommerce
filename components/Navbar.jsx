'use client';

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Menu, X, User, Search, Home, Star, Mail, Grid } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import SearchDialog from "./SearchDialog";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { toast } from "sonner";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { cartItems } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      window.location.replace('/');
    } catch (error) {
      toast.error('Logout failed:', error)
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleBottomNavClick = (path) => {
    router.push(path);
    closeMobileMenu();
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-900 to-indigo-800 shadow-lg py-3 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo and brand */}
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/" className="hover:scale-105 transition-all duration-300 cursor-pointer">
              <Image 
                src="https://res.cloudinary.com/djr7uqara/image/upload/v1753889584/simy5xzhfzlxxpdpgvlg.png" 
                alt="Wayakart Logo"
                width={120}
                height={40}
                className="h-8 w-auto md:h-10"
                priority
              />
            </Link>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-2xl font-bold text-white">
                WayaKart
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 ml-8">
            <Link 
              href="/" 
              className="px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-all duration-300 cursor-pointer text-sm flex items-center gap-2"
            >
              <Home className="h-4 w-4" /> Home
            </Link>
            <Link 
              href="/#products" 
              className="px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-all duration-300 cursor-pointer text-sm flex items-center gap-2"
            >
              <Grid className="h-4 w-4" /> Products
            </Link>
            <Link 
              href="/#testimonials" 
              className="px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-all duration-300 cursor-pointer text-sm flex items-center gap-2"
            >
              <Star className="h-4 w-4" /> Testimonials
            </Link>
            <Link 
              href="/#contact" 
              className="px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-all duration-300 cursor-pointer text-sm flex items-center gap-2"
            >
              <Mail className="h-4 w-4" /> Contact
            </Link>
          </nav>

          {/* Right side icons and buttons */}
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-purple-300 hover:bg-white/10 transition-all duration-300 cursor-pointer rounded-full h-9 w-9"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-purple-300 hover:bg-white/10 transition-all duration-300 relative cursor-pointer rounded-full h-9 w-9"
              onClick={() => router.push("/cart")}
            >
              <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Button>

            {status === "authenticated" ? (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-purple-300 hover:bg-white/10 transition-all duration-300 cursor-pointer rounded-full gap-1"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm">Account</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white text-purple-800 border-white hover:bg-white/90 hover:text-purple-900 cursor-pointer rounded-full text-sm"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            ) : status === "unauthenticated" ? (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/auth/login">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white hover:text-purple-300 hover:bg-white/10 transition-all duration-300 cursor-pointer rounded-full text-sm"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white text-purple-800 border-white hover:bg-white/90 hover:text-purple-900 cursor-pointer rounded-full text-sm"
                  >
                    Register
                  </Button>
                </Link>
              </div>
            ) : null}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:text-purple-300 hover:bg-white/10 transition-all duration-300 cursor-pointer rounded-full h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu - Full screen with bottom nav */}
        <div
          className={cn(
            "fixed inset-0 bg-gradient-to-b from-purple-900 to-indigo-900 z-40 transition-all duration-300 pt-16 pb-24 overflow-y-auto",
            mobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
          )}
        >
          <nav className="flex flex-col items-center gap-3 p-4">
            <Link
              href="/"
              className="w-full text-center px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300 cursor-pointer flex items-center justify-center gap-3"
              onClick={closeMobileMenu}
            >
              <Home className="h-5 w-5" /> Home
            </Link>
            <Link
              href="/#products"
              className="w-full text-center px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300 cursor-pointer flex items-center justify-center gap-3"
              onClick={closeMobileMenu}
            >
              <Grid className="h-5 w-5" /> Products
            </Link>
            <Link
              href="/#testimonials"
              className="w-full text-center px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300 cursor-pointer flex items-center justify-center gap-3"
              onClick={closeMobileMenu}
            >
              <Star className="h-5 w-5" /> Testimonials
            </Link>
            <Link
              href="/#contact"
              className="w-full text-center px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300 cursor-pointer flex items-center justify-center gap-3"
              onClick={closeMobileMenu}
            >
              <Mail className="h-5 w-5" /> Contact
            </Link>

            <div className="w-full border-t border-purple-400/30 my-3"></div>

            {status === "authenticated" ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <Link href="/dashboard" className="w-full" onClick={closeMobileMenu}>
                  <Button
                    className="w-full bg-white text-purple-900 hover:bg-purple-100 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <User className="h-5 w-5" /> Account
                  </Button>
                </Link>
                <Button
                  className="w-full border border-white text-white hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                >
                  Logout
                </Button>
              </div>
            ) : status === "unauthenticated" ? (
              <div className="flex flex-col gap-2 w-full">
                <Link href="/auth/login" className="w-full" onClick={closeMobileMenu}>
                  <Button
                    className="w-full bg-white text-purple-900 hover:bg-purple-100 transition-colors cursor-pointer"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register" className="w-full" onClick={closeMobileMenu}>
                  <Button className="w-full border border-white text-white hover:bg-white/10 transition-colors cursor-pointer">
                    Register
                  </Button>
                </Link>
              </div>
            ) : null}
          </nav>
        </div>
      </header>

      {/* Fixed Bottom Navigation - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-800 to-indigo-800 border-t border-purple-400/20 z-50 flex justify-around items-center py-3 px-4 md:hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          className={`text-white hover:text-purple-300 transition-colors ${pathname === '/' ? 'text-purple-300 bg-white/10 rounded-full' : ''}`}
          onClick={() => handleBottomNavClick("/")}
        >
          <Home className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`text-white hover:text-purple-300 transition-colors ${pathname === '/#products' ? 'text-purple-300 bg-white/10 rounded-full' : ''}`}
          onClick={() => handleBottomNavClick("/#products")}
        >
          <Grid className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`text-white hover:text-purple-300 transition-colors relative ${pathname === '/cart' ? 'text-purple-300 bg-white/10 rounded-full' : ''}`}
          onClick={() => handleBottomNavClick("/cart")}
        >
          <ShoppingCart className="h-5 w-5" />
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`text-white hover:text-purple-300 transition-colors ${pathname === '/#contact' ? 'text-purple-300 bg-white/10 rounded-full' : ''}`}
          onClick={() => handleBottomNavClick("/#contact")}
        >
          <Mail className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`text-white hover:text-purple-300 transition-colors ${pathname.includes('/dashboard') || pathname.includes('/auth') ? 'text-purple-300 bg-white/10 rounded-full' : ''}`}
          onClick={() => handleBottomNavClick(status === "authenticated" ? "/dashboard" : "/auth/login")}
        >
          <User className="h-5 w-5" />
        </Button>
      </div>

      <SearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Navbar;