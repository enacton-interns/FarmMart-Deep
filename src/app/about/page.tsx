'use client';

import SEO from '@/components/SEO';

export default function AboutPage() {
  return (
    <>
      <SEO 
        title="About Us - FarmMarket" 
        description="Learn about our mission to connect local farmers with consumers" 
      />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center py-12">
              <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                About FarmMarket
              </h1>
              <p className="mt-3 text-lg text-gray-500">
                Connecting local farmers with conscious consumers since 2023
              </p>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden mb-12">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Our Mission</h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <p className="text-base text-gray-700">
                  At FarmMarket, we're on a mission to create a more sustainable and transparent food system. 
                  We believe that everyone deserves access to fresh, locally-grown produce while supporting 
                  the hardworking farmers who make it possible.
                </p>
                <p className="mt-4 text-base text-gray-700">
                  By connecting consumers directly with local farmers, we eliminate unnecessary middlemen, 
                  reduce food miles, and ensure that farmers receive a fair price for their products. 
                  This not only supports local economies but also promotes environmentally-friendly farming practices.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mb-12">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-green-50">
                  <h3 className="text-lg font-medium text-gray-900">For Consumers</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">Access to fresh, locally-grown produce</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">Know exactly where your food comes from</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">Support local farmers and economies</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">Reduce your environmental footprint</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-green-50">
                  <h3 className="text-lg font-medium text-gray-900">For Farmers</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">Fair pricing for your products</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">Direct connection with consumers</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">Reduced dependency on middlemen</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">Tools to grow and manage your business</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-green-50">
                  <h3 className="text-lg font-medium text-gray-900">Our Values</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">Transparency in the food system</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">Sustainability and environmental stewardship</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">Support for local economies</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">Community and connection</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden mb-12">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Our Story</h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <p className="text-base text-gray-700">
                  FarmMarket was founded in 2023 by a group of passionate individuals who saw the need for a 
                  more direct connection between farmers and consumers. Our founders, with backgrounds in 
                  agriculture, technology, and sustainable business, came together with a shared vision: 
                  to create a platform that would make locally-grown food more accessible to everyone.
                </p>
                <p className="mt-4 text-base text-gray-700">
                  What started as a small pilot program with just a handful of local farms has now grown 
                  into a thriving community of farmers and consumers across the region. We're proud to 
                  support over 100 local farms and serve thousands of customers who share our commitment 
                  to fresh, sustainable food.
                </p>
                <p className="mt-4 text-base text-gray-700">
                  As we look to the future, we're excited to continue expanding our reach while staying 
                  true to our core values. We believe that by working together, we can create a food system 
                  that's better for everyone—farmers, consumers, and the planet.
                </p>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Meet Our Team</h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="text-center">
                    <img
                      className="mx-auto h-24 w-24 rounded-full"
                      src="/images/team/john.jpg"
                      alt="John Smith"
                    />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">John Smith</h3>
                    <p className="text-sm text-gray-500">CEO & Co-Founder</p>
                    <p className="mt-2 text-sm text-gray-700">
                      Former agricultural economist with a passion for sustainable food systems.
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <img
                      className="mx-auto h-24 w-24 rounded-full"
                      src="/images/team/sarah.jpg"
                      alt="Sarah Johnson"
                    />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Sarah Johnson</h3>
                    <p className="text-sm text-gray-500">CTO & Co-Founder</p>
                    <p className="mt-2 text-sm text-gray-700">
                      Tech entrepreneur with experience building scalable platforms for social good.
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <img
                      className="mx-auto h-24 w-24 rounded-full"
                      src="/images/team/mike.jpg"
                      alt="Mike Chen"
                    />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Mike Chen</h3>
                    <p className="text-sm text-gray-500">Head of Farm Partnerships</p>
                    <p className="mt-2 text-sm text-gray-700">
                      Third-generation farmer dedicated to supporting local agriculture.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}