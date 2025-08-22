import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaInstagram, FaLinkedinIn, FaYoutube } from "react-icons/fa";
import BookDemoPopup from "./BookDemoPopup"; // adjust the path if needed

const Footer: React.FC = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const openPopup = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigation on the Link
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  return (
    <footer className="bg-gray-50 text-gray-600 border-t border-gray-200 mt-10">
      {/* Top Section */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 px-6 py-8">
        {/* Brand & Socials */}
        <div className="space-y-6">
          <div className="flex items-center">
            <img
              src="/Willovate_Resto_Logo.png"
              alt="Willovate Resto Logo"
              className="h-20 object-contain"
            />
          </div>
          <p className="text-gray-500 text-md leading-relaxed">
            Redefining dining experiences with innovation and excellence.
          </p>
          <div className="flex gap-5">
            <a
              href="https://www.instagram.com/willovate_/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-orange-500 transition-colors duration-300"
              aria-label="Instagram"
            >
              <FaInstagram className="text-xl" />
            </a>
            <a
              href="https://www.linkedin.com/company/willovate-private-limited/posts/?feedView=all"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-orange-500 transition-colors duration-300"
              aria-label="LinkedIn"
            >
              <FaLinkedinIn className="text-xl" />
            </a>
            <a
              href="https://youtube.com/@willovate?si=n2EFzCB8hRSNd4yl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-orange-500 transition-colors duration-300"
              aria-label="YouTube"
            >
              <FaYoutube className="text-xl" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-gray-800 font-medium uppercase tracking-wider text-sm mb-6">
            Quick Links
          </h4>
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className="text-gray-500 hover:text-orange-500 transition-colors duration-200 text-md"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className="text-gray-500 hover:text-orange-500 transition-colors duration-200 text-md"
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                to="/how-it-works"
                className="text-gray-500 hover:text-orange-500 transition-colors duration-200 text-md"
              >
                How It Works
              </Link>
            </li>
            <li>
              <Link
                to="/plan-section"
                className="text-gray-500 hover:text-orange-500 transition-colors duration-200 text-md"
              >
                Our Plans
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal Pages */}
        <div>
          <h4 className="text-gray-800 font-medium uppercase tracking-wider text-sm mb-6">
            Legal
          </h4>
          <ul className="space-y-2">
            <li>
              <Link
                to="/t&c"
                className="text-gray-500 hover:text-orange-500 transition-colors duration-200 text-md"
              >
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link
                to="/privacy-policy"
                className="text-gray-500 hover:text-orange-500 transition-colors duration-200 text-md"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                to="/cancellation-policy"
                className="text-gray-500 hover:text-orange-500 transition-colors duration-200 text-md"
              >
                Cancellation Policy
              </Link>
            </li>
            <li>
              <Link
                to="#"
                onClick={openPopup}
                className="text-gray-500 hover:text-orange-500 transition-colors duration-200 text-md cursor-pointer"
              >
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Company Info */}
        <div>
          <h4 className="text-gray-800 font-medium uppercase tracking-wider text-sm mb-6">
            About Willovate Resto
          </h4>
          <p className="text-gray-500 text-md mb-4 leading-relaxed">
            Willovate Resto is an intuitive restaurant management platform that
            empowers food businesses to digitize operations—menu management, QR
            ordering, order tracking, billing, and customer updates—all from one
            place
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto border-t border-gray-200"></div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto py-4 px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} Willovate Resto. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link
              to="/privacy-policy"
              className="text-gray-500 hover:text-orange-500 transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <Link
              to="/t&c"
              className="text-gray-500 hover:text-orange-500 transition-colors duration-200"
            >
              Terms of Service
            </Link>
            <Link
              to="/plan-section"
              className="text-gray-500 hover:text-orange-500 transition-colors duration-200"
            >
              Pricing
            </Link>
          </div>
        </div>
      </div>

      {/* Book Demo Popup */}
      <BookDemoPopup isOpen={isPopupOpen} onClose={closePopup} />
    </footer>
  );
};

export default Footer;
