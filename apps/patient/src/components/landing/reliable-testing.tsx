import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check } from "lucide-react"
import Link from "next/link"

export default function ReliableTestingSection() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="w-full lg:w-1/2">
          <div className="mb-6 sm:mb-8">
            <span className="text-[#001C3D] font-semibold mb-2 block text-sm sm:text-base">YOUR HEALTH, OUR PRIORITY</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              Reliable Lab Testing for
              <span className="text-blue-900 block mt-1">All Your Health Needs</span>
            </h2>
          </div>

          <Tabs defaultValue="why-need" className="w-full flex flex-col">
            <TabsList className="h-auto flex-col md:flex-row mb-10 md:mb-0 min-h-[150px] md:min-h-fit gap-3 w-full bg-transparent">
              <TabsTrigger value="why-need" className="w-full sm:w-auto flex-1 text-left px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg rounded-xl border border-gray-200 hover:border-blue-500 transition-all duration-200 data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 flex items-center justify-between group">
                <span>Why Need Consultation?</span>
              </TabsTrigger>
              <TabsTrigger value="why-choose" className="w-full sm:w-auto flex-1 text-left px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg rounded-xl border border-gray-200 hover:border-blue-500 transition-all duration-200 data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 flex items-center justify-between group">
                <span>Why Choose Us</span>
              </TabsTrigger>
              <TabsTrigger value="how-works" className="w-full sm:w-auto flex-1 text-left px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg rounded-xl border border-gray-200 hover:border-blue-500 transition-all duration-200 data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 flex items-center justify-between group">
                <span>How it Works</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="why-need" className="mt-2 sm:mt-8 p-6 sm:p-8 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-900">Why Regular Lab Testing Matters</h3>
              <div className="space-y-4 sm:space-y-6">
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">Staying informed about your health is essential for early detection, effective treatment, and peace of mind. Our lab testing services help you:</p>
                <ul className="space-y-3 sm:space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="mt-1"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></span>
                    <span className="text-gray-700 text-sm sm:text-base">Get timely diagnosis and early detection of health conditions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></span>
                    <span className="text-gray-700 text-sm sm:text-base">Access a wide range of lab tests from the comfort of your home</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></span>
                    <span className="text-gray-700 text-sm sm:text-base">Receive accurate and reliable test results</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></span>
                    <span className="text-gray-700 text-sm sm:text-base">Ensure continuity of care with integrated health support</span>
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="why-choose" className="mt-6 sm:mt-8 p-6 sm:p-8 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-900">What Sets LabLink Apart</h3>
              <div className="space-y-4 sm:space-y-6">
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">We're committed to making quality healthcare accessible and convenient. Here's why thousands trust LabLink:</p>
                <ul className="space-y-3 sm:space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="mt-1"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></span>
                    <span className="text-gray-700 text-sm sm:text-base"><strong>Nationwide Network:</strong> Access to certified labs across all 36 states and the FCT</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></span>
                    <span className="text-gray-700 text-sm sm:text-base"><strong>Fast Results:</strong> Get your test results quickly with real-time notifications</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></span>
                    <span className="text-gray-700 text-sm sm:text-base"><strong>Certified Labs:</strong> All partner labs are accredited and meet international standards</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></span>
                    <span className="text-gray-700 text-sm sm:text-base"><strong>Transparent Pricing:</strong> No hidden fees - see exact costs before booking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></span>
                    <span className="text-gray-700 text-sm sm:text-base"><strong>Secure Platform:</strong> Your health data is encrypted and protected with industry-leading security</span>
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="how-works" className="mt-6 sm:mt-8 p-6 sm:p-8 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-900">Getting Started is Simple</h3>
              <div className="space-y-4 sm:space-y-6">
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">Book your lab test in just a few easy steps:</p>
                <div className="space-y-4 sm:space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-900 font-bold text-sm sm:text-base">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Find a Lab Near You</h4>
                      <p className="text-gray-600 text-sm sm:text-base">Search for labs by location or use our "Near Me" feature to find the closest certified lab</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-900 font-bold text-sm sm:text-base">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Choose Your Test</h4>
                      <p className="text-gray-600 text-sm sm:text-base">Browse available tests, compare prices, and select the one that meets your needs</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-900 font-bold text-sm sm:text-base">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Book Your Appointment</h4>
                      <p className="text-gray-600 text-sm sm:text-base">Select a convenient date and time, then confirm your booking instantly</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-900 font-bold text-sm sm:text-base">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Get Your Results</h4>
                      <p className="text-gray-600 text-sm sm:text-base">Receive notifications when your results are ready and access them securely from your dashboard</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-full lg:w-1/2 mt-6 lg:mt-0">
          <div className="relative aspect-[4/3] mb-6 sm:mb-8">
            <img src="/medical-lab-professional.jpg" alt="Medical lab professional working" className="rounded-xl sm:rounded-2xl object-cover w-full h-full shadow-lg sm:shadow-xl" />
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-t from-blue-900/20 to-transparent"></div>
          </div>
          <div className="bg-gradient-to-br from-[#001C3D] to-blue-900 text-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg sm:shadow-xl">
            <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Ready to Take Charge of Your Health?</h3>
            <p className="mb-6 sm:mb-8 text-blue-100 leading-relaxed text-sm sm:text-base">Book a test with our trusted lab today and get accurate, timely results to support your health journey.</p>
            <Link href="/auth/signin" className="w-full sm:w-auto bg-white text-blue-900 px-4 sm:px-6 py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 flex items-center justify-center sm:justify-start gap-2 group text-sm sm:text-base">
              Book a Lab Test
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
