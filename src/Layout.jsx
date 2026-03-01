import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

export default function Layout({ children, currentPageName }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const navItems = [
    { name: "Home", path: "Home" },
    { name: "Angebote", path: "Services" },
    { name: "Bewertungen", path: "Reviews" },
    { name: "Anfrage", path: "Booking" },
  ];

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/30 backdrop-blur-2xl border-b border-white/20 shadow-xl shadow-black/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link to={createPageUrl("Home")} className="text-gray-800 hover:text-stone-700 transition-colors">
              <span className="text-sm font-normal block leading-tight">Yogaschule</span>
              <span className="text-xl font-semibold tracking-tight">Rosemarie Fischlin</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={createPageUrl(item.path)}
                  className={`text-gray-700 hover:text-slate-900 transition-colors font-medium ${
                    currentPageName === item.path ? "text-slate-900 border-b-2 border-slate-900" : ""
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-800"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={createPageUrl(item.path)}
                  className={`block text-gray-700 hover:text-slate-900 transition-colors py-2 ${
                    currentPageName === item.path ? "text-slate-900 font-semibold" : ""
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-800 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-gray-300">
            © {new Date().getFullYear()} Yogaschule Rosemarie Fischlin
          </p>
          <p className="text-xs text-gray-400 mt-2">Gemüsemarkt 5, 9450 Altstätten, Schweiz</p>
        </div>
      </footer>
    </div>
  );
}