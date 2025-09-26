'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CheckoutCancelPage() {
  const { items } = useCart();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <svg className="mx-auto h-16 w-16 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">Payment Canceled</h1>
        <p className="text-gray-600 mt-2">
          You have canceled the payment process. Your order has not been placed.
        </p>
        
        {items.length > 0 ? (
          <div className="mt-6 space-y-3">
            <Link
              href="/checkout"
              className="block w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              Return to Checkout
            </Link>
            <Link
              href="/products"
              className="block w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            <Link
              href="/products"
              className="block w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}