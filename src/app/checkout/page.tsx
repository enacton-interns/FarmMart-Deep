'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SEO from '@/components/SEO';
import { toast } from 'react-toastify';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || 'pk_test_51S2VYo2Fkl5ZhxzyAnBf7ncofMRpwPyWiXBXoQEQwEECu8q2H9z7mQqF5hHDV6AR1wpodCpDJWSrlgFZhrmH11tE00HNO7QkRG');

// Stripe Payment Form Component
function PaymentForm({
  formData,
  cartItems,
  getTotal,
  onSuccess,
  onClearCart
}: {
  formData: CheckoutFormData;
  cartItems: CartItem[];
  getTotal: () => number;
  onSuccess: (orderId: string) => void;
  onClearCart: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string>('');
  const [cardComplete, setCardComplete] = useState<boolean>(false);

  const handleCardChange = (event: any) => {
    setCardError(event.error ? event.error.message : '');
    setCardComplete(event.complete);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    console.log('PaymentForm: Starting payment process');

    if (!stripe || !elements) {
      console.error('PaymentForm: Stripe or elements not loaded');
      toast.error('Payment system not ready. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('PaymentForm: Creating payment intent...');

      // Create payment intent
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(`${baseUrl}/api/checkout/payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: Math.round(getTotal() * 100), // Convert to cents
          items: cartItems,
        }),
      });

      console.log('PaymentForm: Payment intent response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('PaymentForm: Payment intent creation failed:', errorData);
        toast.error(errorData.error || 'Failed to initialize payment');
        return;
      }

      const { clientSecret } = await response.json();
      console.log('PaymentForm: Received client secret');

      if (!clientSecret) {
        console.error('PaymentForm: No client secret received');
        toast.error('Payment initialization failed');
        return;
      }

      console.log('PaymentForm: Confirming card payment...');

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: {
              line1: formData.address,
              city: formData.city,
              state: formData.state,
              postal_code: formData.zipCode,
            },
          },
        },
      });

      console.log('PaymentForm: Payment confirmation result:', { error: error?.message, status: paymentIntent?.status });

      if (error) {
        console.error('PaymentForm: Payment failed:', error);
        toast.error(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('PaymentForm: Payment succeeded, creating order...');
        // Payment successful, create order
        await createOrderAfterPayment();
      } else {
        console.log('PaymentForm: Payment not completed, status:', paymentIntent?.status);
        toast.error('Payment was not completed');
      }
    } catch (error) {
      console.error('PaymentForm: Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const createOrderAfterPayment = async () => {
    console.log('PaymentForm: Starting order creation after payment');

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      console.log('PaymentForm: Cart items count:', cartItems.length);

      // First, decrease product quantities
      console.log('PaymentForm: Updating product quantities...');
      const inventoryUpdates = cartItems.map(item =>
        fetch(`${baseUrl}/api/products/${item.productId}/quantity`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ quantity: item.quantity }),
        })
      );

      const inventoryResults = await Promise.all(inventoryUpdates);
      const failedUpdates = inventoryResults.filter(result => !result.ok);

      console.log('PaymentForm: Inventory updates completed, failed:', failedUpdates.length);

      if (failedUpdates.length > 0) {
        console.error('PaymentForm: Some inventory updates failed');
        toast.error('Some items are out of stock. Please update your cart.');
        return;
      }

      // Create order
      console.log('PaymentForm: Creating order...');
      const orderData = {
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: getTotal(),
        deliveryAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
        deliveryDate: formData.deliveryDate,
        deliveryInstructions: formData.deliveryInstructions,
        paymentMethod: 'online_payment',
        paymentStatus: 'paid',
      };

      console.log('PaymentForm: Order data:', orderData);

      const response = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      console.log('PaymentForm: Order creation response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('PaymentForm: Order created successfully:', data);
        // Clear cart using CartContext
        onClearCart();
        toast.success('Payment successful! Order placed.');
        onSuccess(data.orders[0].id);
      } else {
        const errorData = await response.json();
        console.error('PaymentForm: Order creation failed:', errorData);
        toast.error(`Order creation failed: ${errorData.error || 'Please contact support.'}`);
      }
    } catch (error) {
      console.error('PaymentForm: Order creation error:', error);
      toast.error('Order creation failed. Please contact support.');
    }
  };



  return (
    <div className="space-y-6">
      {/* Payment Method Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Secure Payment</h3>
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          SSL Encrypted
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information *
          </label>
          <div className={`border rounded-lg p-4 transition-all ${
            cardError
              ? 'border-red-300 bg-red-50'
              : cardComplete
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500'
          }`}>
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    fontFamily: '"Inter", system-ui, sans-serif',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
                hidePostalCode: true,
              }}
              onChange={handleCardChange}
            />
          </div>
          {cardError && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {cardError}
            </p>
          )}
          {cardComplete && !cardError && (
            <p className="mt-2 text-sm text-green-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Card information complete
            </p>
          )}
        </div>

        {/* Billing Address Notice */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-gray-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Billing Address</h4>
              <p className="mt-1 text-sm text-gray-600">
                We'll use the delivery address you provided above for billing purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Pay Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!stripe || !elements || isProcessing || !cardComplete || !!cardError}
          className="w-full inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-semibold rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700 transition-all duration-200"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Payment...
            </>
          ) : (
            <>
              <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Pay ${getTotal().toFixed(2)} Securely
            </>
          )}
        </button>

        {/* Security Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center">
            <svg className="w-3 h-3 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Your payment information is encrypted and secure
          </p>
        </div>
      </form>
    </div>
  );
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  farmerId: string;
  farmerName: string;
}

interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  deliveryDate: string;
  deliveryInstructions: string;
  paymentMethod: 'cash_on_delivery' | 'online_payment';
}

export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const { clearCart } = useCart();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    deliveryDate: '',
    deliveryInstructions: '',
    paymentMethod: 'cash_on_delivery',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user) {
      // Load cart from localStorage
      const savedCart = localStorage.getItem('farmmarket-cart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          // Transform cart items to match the expected interface
          const transformedCart = parsedCart.map((item: any) => ({
            productId: item.productId,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : '',
            farmerId: item.product.farmerId,
            farmerName: item.product.farmerName,
          }));
          setCartItems(transformedCart);

          // Pre-fill form with user data
          setFormData(prev => ({
            ...prev,
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
            city: '',
            state: '',
            zipCode: '',
            deliveryDate: '',
            deliveryInstructions: '',
          }));
        } catch (error) {
          console.error('Error parsing cart data:', error);
          setCartItems([]);
        }
      }
    }
  }, [user, loading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'radio' && name === 'paymentMethod') {
      setFormData(prev => ({
        ...prev,
        [name]: value as 'cash_on_delivery' | 'online_payment',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {

      // Create order data
      const orderData = {
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: getTotal(),
        deliveryAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
        deliveryDate: formData.deliveryDate,
        deliveryInstructions: formData.deliveryInstructions,
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentMethod === 'online_payment' ? 'paid' : 'pending',
      };

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        // Clear cart
        localStorage.removeItem('farmmarket-cart');

        // Redirect to order confirmation
        const data = await response.json();
        router.push(`/checkout/success?orderId=${data.orders[0].id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getShipping = () => {
    return getSubtotal() > 50 ? 0 : 5.99; // Free shipping over $50
  };

  const getTax = () => {
    return getSubtotal() * 0.08; // 8% tax
  };

  const getTotal = () => {
    return getSubtotal() + getShipping() + getTax();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to signin
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Add some fresh produce to your cart before checking out.</p>
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Checkout - FarmMarket"
        description="Complete your purchase and provide delivery information"
      />

      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Link
              href="/cart"
              className="text-green-600 hover:text-green-800 flex items-center text-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Cart
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Contact Information */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold mr-3">1</div>
                      Contact Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                          placeholder="(123) 456-7890"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold mr-3">2</div>
                      Delivery Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          required
                          value={formData.address}
                          onChange={handleChange}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                          placeholder="123 Main Street"
                        />
                      </div>
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          required
                          value={formData.city}
                          onChange={handleChange}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                          placeholder="New York"
                        />
                      </div>
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          id="state"
                          name="state"
                          required
                          value={formData.state}
                          onChange={handleChange}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                          placeholder="NY"
                        />
                      </div>
                      <div>
                        <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP Code *
                        </label>
                        <input
                          type="text"
                          id="zipCode"
                          name="zipCode"
                          required
                          value={formData.zipCode}
                          onChange={handleChange}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                          placeholder="10001"
                        />
                      </div>
                      <div>
                        <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1">
                          Preferred Delivery Date *
                        </label>
                        <input
                          type="date"
                          id="deliveryDate"
                          name="deliveryDate"
                          required
                          min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Tomorrow minimum
                          value={formData.deliveryDate}
                          onChange={handleChange}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor="deliveryInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Instructions (Optional)
                        </label>
                        <textarea
                          id="deliveryInstructions"
                          name="deliveryInstructions"
                          rows={3}
                          value={formData.deliveryInstructions}
                          onChange={handleChange}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                          placeholder="Leave at front door, ring bell twice, etc."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold mr-3">3</div>
                      Payment Method
                    </h2>
                    <div className="space-y-4">
                      {/* Cash on Delivery */}
                      <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        formData.paymentMethod === 'cash_on_delivery'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash_on_delivery"
                            checked={formData.paymentMethod === 'cash_on_delivery'}
                            onChange={handleChange}
                            className="mt-1 text-green-600 focus:ring-green-500"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center">
                              <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                              </svg>
                              <h3 className="text-sm font-medium text-gray-900">Cash on Delivery</h3>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                              Pay when your fresh produce is delivered to your door. No credit card required!
                            </p>
                          </div>
                        </label>
                      </div>

                      {/* Online Payment */}
                      <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        formData.paymentMethod === 'online_payment'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="online_payment"
                            checked={formData.paymentMethod === 'online_payment'}
                            onChange={handleChange}
                            className="mt-1 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center">
                              <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              <h3 className="text-sm font-medium text-gray-900">Online Payment</h3>
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Secure
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                              Pay securely online with credit/debit card. Fast and convenient!
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Stripe Payment Form */}
                    {formData.paymentMethod === 'online_payment' && (
                      <div className="mt-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
                        <Elements stripe={stripePromise}>
                          <PaymentForm
                            formData={formData}
                            cartItems={cartItems}
                            getTotal={getTotal}
                            onSuccess={(orderId) => {
                              router.push(`/checkout/success?orderId=${orderId}`);
                            }}
                            onClearCart={clearCart}
                          />
                        </Elements>
                      </div>
                    )}
                  </div>

                  {/* Place Order Button - Only show for Cash on Delivery */}
                  {formData.paymentMethod === 'cash_on_delivery' && (
                    <div className="flex justify-end pt-6">
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-lg shadow-sm text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {isProcessing ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing Order...
                          </>
                        ) : (
                          <>
                            Place Order - ${getTotal().toFixed(2)}
                            <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                  </svg>
                  Order Summary
                </h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={item.image || '/images/placeholder.jpg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Totals */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">${getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">
                      {getShipping() === 0 ? 'FREE' : `$${getShipping().toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">${getTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total</span>
                    <span className="text-green-600">${getTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Free Shipping Notice */}
                {getSubtotal() < 50 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-green-800">
                        Add ${(50 - getSubtotal()).toFixed(2)} more for free shipping!
                      </span>
                    </div>
                  </div>
                )}

                {/* Security Notice */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Secure Checkout</h4>
                      <p className="mt-1 text-sm text-blue-700">
                        Your information is protected and your order is processed securely.
                      </p>
                    </div>
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
