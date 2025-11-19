import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import { Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-[#001C3D] text-gray-300">
      <div className="absolute inset-0 bg-cover bg-center z-0" aria-hidden="true" style={{ backgroundImage: "url('/images/footer.jpg')", backgroundSize: 'cover', backgroundPosition: 'center center', opacity: 0.1 }}></div>
      <div className="relative container px-4 py-16 mx-auto">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white uppercase">
                <Link className="flex items-center space-x-2" href="/">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                    <Image src="/lab-link-logo.jpg" alt="Company Logo" width={48} height={48} className="w-12 h-12 object-contain" />
                  </div>
                  <h1 className="text-xl uppercase hidden lg:flex font-bold text-white hover:text-blue-400 transition-colors">Lab Link</h1>
                </Link>
              </h2>
              <p className="mt-4 text-sm text-gray-400 leading-relaxed">
                We are committed to excellence in every aspect of our healthcare services, maintaining the highest standards in patient care, treatment, and well-being.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white uppercase after:content-[''] after:block after:w-12 after:h-1 after:bg-blue-400 after:mt-2">Company</h3>
            <ul className="space-y-3">
              <li><Link className="text-sm text-gray-400 hover:text-blue-400 transition-colors inline-block" href="/about">About Us</Link></li>
              <li><Link className="text-sm text-gray-400 hover:text-blue-400 transition-colors inline-block" href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white uppercase after:content-[''] after:block after:w-12 after:h-1 after:bg-blue-400 after:mt-2">Legal</h3>
            <ul className="space-y-3">
              <li><Link className="text-sm text-gray-400 hover:text-blue-400 transition-colors inline-block" href="/privacy">Privacy Policy</Link></li>
              <li><Link className="text-sm text-gray-400 hover:text-blue-400 transition-colors inline-block" href="/terms">Terms of Service</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
              <p className="text-sm text-gray-400">08058765439</p>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-blue-400" />
              <a className="text-sm hover:text-blue-400 transition-colors" href="mailto:healthesphere@gmail.com">healthesphere@gmail.com</a>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-gray-700/50">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">© 2025 Lab Link. All rights reserved.</p>
            <div className="flex space-x-6">
              <Link className="text-sm text-gray-400 hover:text-blue-400 transition-colors" href="/privacy">Privacy Policy</Link>
              <Link className="text-sm text-gray-400 hover:text-blue-400 transition-colors" href="/terms">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
      <Button className="fixed bottom-6 right-6 bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 opacity-100 translate-y-0" aria-label="Scroll to top">
      </Button>
    </footer>
  )
}
