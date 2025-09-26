'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SEO from '@/components/SEO';

export default function SeedPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSeed = async () => {
    setIsSeeding(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        
        // Redirect to home page after successful seeding
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to seed database');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <>
      <SEO 
        title="Seed Database - FarmMarket" 
        description="Seed the database with sample data" 
      />
      
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <h1 className="mb-6 text-center text-3xl font-extrabold text-gray-900">
              Seed Database
            </h1>
            
            <p className="mb-6 text-sm text-gray-600 text-center">
              This will clear all existing data and populate the database with sample users, farmers, and products.
            </p>
            
            {message && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {message}
              </div>
            )}
            
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div className="mt-6">
              <button
                onClick={handleSeed}
                disabled={isSeeding}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400"
              >
                {isSeeding ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Seeding Database...
                  </>
                ) : (
                  'Seed Database'
                )}
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/')}
                className="text-sm font-medium text-green-600 hover:text-green-500"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}