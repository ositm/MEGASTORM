import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight } from "lucide-react";
import { Input } from "../ui/input";

export default function FinalCTA() {
  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-white to-blue-50">
      <div className="container px-4 mx-auto">
        <div className="rounded-xl border bg-card text-card-foreground mx-auto shadow-md hover:shadow-xl transition-shadow duration-300">
          <div className="p-6 md:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-12">
              <div className="lg:w-1/2 mb-8 lg:mb-0">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-blue-100 transform hover:scale-105 transition-transform duration-200">
                  <Mail className="w-8 h-8 text-[#001C3D]" />
                </div>
                <h2 className="mb-4 text-2xl md:text-3xl text-[#001C3D] lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text">
                  Join Our Health Insights Mailing List
                </h2>
                <p className="text-gray-600 text-sm md:text-base lg:text-lg max-w-xl">
                  Stay updated with the latest health trends, lab testing news,
                  and medical breakthroughs. Join thousands of health-conscious
                  individuals who rely on our expert health updates.
                </p>
                <p className="mt-6 text-xs text-gray-500">
                  By subscribing, you agree to receive medical and
                  health-related emails from us. You can unsubscribe at any
                  time.
                </p>
              </div>
              <div className="lg:w-1/2">
                <form className="space-y-6 bg-white md:p-8 rounded-lg shadow-sm">
                  <div className="space-y-4">
                    <div>
                      <label
                        className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium inline-block mb-1.5"
                        htmlFor="email"
                      >
                        Email
                      </label>
                      <Input
                        className="flex h-9 rounded-md border bg-transparent px-3 py-1 text-base shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        id="email"
                        placeholder="Enter your email"
                        required
                        type="email"
                        name="email"
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full bg-primary hover:bg-blue-700 text-white"
                    type="submit"
                  >
                    Subscribe
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
