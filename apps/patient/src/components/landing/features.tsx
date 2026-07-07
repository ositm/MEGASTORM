import { CalendarCheck, FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function FeaturesSection() {
    return (
        <section id="about" className=" py-16">
        <div className="max-w-[1500px] mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-4">Why Choose Lab Link?</h2>
          <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start mb-12">
            <p className="text-white text-lg lg:max-w-xl">We make healthcare management effortless and transparent.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#032540] p-6 rounded-lg shadow-md text-left">
              <CalendarCheck className="text-primary w-10 h-10 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Easy Booking</h3>
              <p className="text-gray-300 mb-4">Schedule lab tests with just a few clicks, anytime, anywhere.</p>
              <Link className="inline-flex items-center text-primary font-medium hover:underline" href="/auth/signin">
                LEARN MORE 
              </Link>
            </div>
            <div className="bg-[#032540] p-6 rounded-lg shadow-md text-left">
                <FileText className="text-primary w-10 h-10 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Quick Results</h3>
              <p className="text-gray-300 mb-4">Access comprehensive test results securely online within hours.</p>
              <Link className="inline-flex items-center text-primary font-medium hover:underline" href="/auth/signin">
                LEARN MORE
              </Link>
            </div>
            <div className="bg-[#032540] p-6 rounded-lg shadow-md text-left">
                <ShieldCheck className="text-primary w-10 h-10 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Privacy First</h3>
              <p className="text-gray-300 mb-4">Your data is encrypted and protected with bank-level security.</p>
              <Link className="inline-flex items-center text-primary font-medium hover:underline" href="/auth/signin">
                LEARN MORE
              </Link>
            </div>
          </div>
          <div className="mt-16 text-white py-6 rounded-lg inline-block text-lg font-medium text-center">Book lab tests from the comfort of your home. <span className="font-bold text-primary">Schedule Your Test Today!</span></div>
        </div>
      </section>
    )
}