'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SEO from '@/components/SEO';

export default function CheckoutSuccessPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && orderId) {
      fetchOrder();
    } else if (user && !orderId) {
      router.push('/dashboard');
    }
  }, [user, orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/orders/${orderId}`, {
       credentials  : 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        setIsLoading(false);
      } else {
        // If order fetch fails, still show the success page with orderId
        console.error('Failed to fetch order details, but order was created');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      // Don't redirect on fetch error - still show success page
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to signin
  }

  return (
    <>
      <SEO 
        title="Order Confirmation - FarmMarket" 
        description="Your order has been successfully placed" 
      />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center py-12">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <h1 className="mt-4 text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Order Confirmed!
              </h1>
              <p className="mt-3 text-lg text-gray-500">
                Thank you for your purchase. Your order has been successfully placed.
              </p>
              
              {order ? (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-900">
                    Order ID: <span className="text-green-600">#{order.id ? order.id.toString().slice(-8) : 'N/A'}</span>
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    Total: <span className="text-green-600">${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</span>
                  </p>
                </div>
              ) : (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-900">
                    Order ID: <span className="text-green-600">#{orderId ? orderId.slice(-8) : 'Processing...'}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Loading order details...
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">What's Next?</h2>
              </div>
              <div className="border-t border-gray-200">
                <dl className="divide-y divide-gray-200">
                  <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Order Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </dd>
                  </div>
                  <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Confirmation Email</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      A confirmation email has been sent to {user.email}
                    </dd>
                  </div>
                  <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Estimated Delivery</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {order?.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '2-3 business days'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Continue Shopping</h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/products"
                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Browse More Products
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    View Your Orders
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Need help?{' '}
                <Link href="/contact" className="font-medium text-green-600 hover:text-green-500">
                  Contact our support team
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
