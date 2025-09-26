'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SEO from '@/components/SEO';
import ProductForm, { EditProductForm } from '@/components/ProductForm';
import { toast } from 'react-toastify';
import useSWR, { mutate } from 'swr';
import { cacheKeys } from '@/lib/swr-config';

interface Order {
  id: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  createdAt: string;
}



interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
  category: string;
  images: string[];
  available: boolean;
  organic: boolean;
  harvestDate?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('orders');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  // Use SWR for orders data with caching
  const { data: ordersData, error: ordersError, isLoading: ordersLoading, mutate: mutateOrders } = useSWR(
    user ? `/api/orders?role=${user.role}` : null,
    {
      refreshInterval: 30000, // Revalidate every 30 seconds
      revalidateOnFocus: true,
      keepPreviousData: true,
    }
  );

  // Use SWR for purchases data (farmers only)
  const { data: purchasesData, error: purchasesError, isLoading: purchasesLoading, mutate: mutatePurchases } = useSWR(
    user?.role === 'farmer' ? `/api/orders?role=customer` : null,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      keepPreviousData: true,
    }
  );

  // Use SWR for farmer products
  const { data: productsData, error: productsError, isLoading: productsLoading, mutate: mutateProducts } = useSWR(
    user?.role === 'farmer' ? cacheKeys.products({ farmer: 'true' }) : null,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      keepPreviousData: true,
    }
  );

  // Use SWR for dashboard statistics
  const { data: dashboardData, error: dashboardError, isLoading: dashboardLoading } = useSWR(
    user ? '/api/dashboard' : null,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
      keepPreviousData: true,
    }
  );

  const orders = ordersData?.orders || [];
  const purchases = purchasesData?.orders || [];
  const farmerProducts = productsData?.products || [];

  // Handle URL parameters for editing products
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.role === 'farmer') {
      const urlParams = new URLSearchParams(window.location.search);
      const editProductId = urlParams.get('edit');
      const tab = urlParams.get('tab');

      if (editProductId && tab === 'products') {
        // Find the product to edit
        const productToEdit = farmerProducts.find((p: Product) => p.id === editProductId);
        if (productToEdit) {
          setEditingProduct(productToEdit);
          setActiveTab('edit-product');
          // Clean up URL
          window.history.replaceState({}, '', '/dashboard?tab=products');
        }
      }
    }
  }, [user, farmerProducts]);



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-purple-100 text-purple-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setActiveTab('edit-product');
  };

  const handleDeleteProduct = (productId: string) => {
    setShowDeleteConfirm(productId);
  };

  const confirmDeleteProduct = async () => {
    if (!showDeleteConfirm) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const response = await fetch(`${baseUrl}/api/products/${showDeleteConfirm}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Product deleted successfully!');
        mutateProducts(); // Refresh the products list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product. Please try again.');
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleEditSuccess = () => {
    setEditingProduct(null);
    setActiveTab('products');
    mutateProducts(); // Refresh the products list
  };

  const handleEditCancel = () => {
    setEditingProduct(null);
    setActiveTab('products');
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const response = await fetch(`${baseUrl}/api/orders/${orderId}`, {
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('Order status updated successfully!');
        mutateOrders(); // Refresh the orders list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status. Please try again.');
    }
  };

  if (loading) {
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
        title="Dashboard - FarmMarket" 
        description="Manage your account, orders, and preferences" 
      />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {user.name}!
            </p>
          </div>

          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {dashboardLoading ? (
              // Loading skeleton
              Array.from({ length: user.role === 'farmer' ? 4 : 2 }).map((_, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow animate-pulse">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : dashboardError ? (
              <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Failed to load statistics</h3>
                    <p className="mt-1 text-sm text-red-700">Please try refreshing the page.</p>
                  </div>
                </div>
              </div>
            ) : dashboardData && dashboardData.stats ? (
              <>
                {user.role === 'farmer' ? (
                  <>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Orders Received</p>
                          <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalOrdersReceived || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                          <p className="text-2xl font-bold text-gray-900">${(dashboardData.stats.totalEarnings || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Purchases Made</p>
                          <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalPurchasesMade || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Money Spent</p>
                          <p className="text-2xl font-bold text-gray-900">${(dashboardData.stats.totalMoneySpent || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                          <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalPurchasesMade || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Spent</p>
                          <p className="text-2xl font-bold text-gray-900">${(dashboardData.stats.totalMoneySpent || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : null}
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'orders'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {user.role === 'farmer' ? 'Customer Orders' : 'My Orders'}
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Profile
                </button>
                {user.role === 'farmer' && (
                  <>
                    <button
                      onClick={() => setActiveTab('products')}
                      className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                        activeTab === 'products'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      My Products
                    </button>
                    <button
                      onClick={() => setActiveTab('purchases')}
                      className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                        activeTab === 'purchases'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      My Purchases
                    </button>
                  </>
                )}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'orders' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {user.role === 'farmer' ? 'Customer Orders' : 'Order History'}
                    </h2>
                    {user.role === 'customer' && (
                      <Link
                        href="/products"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Shop Now
                      </Link>
                    )}
                  </div>

                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                      <span className="ml-3 text-gray-600">Loading orders...</span>
                    </div>
                  ) : ordersError ? (
                    <div className="text-center py-12">
                      <div className="text-red-500 mb-2">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-semibold text-gray-700 mb-2">Failed to load orders</h2>
                      <p className="text-gray-600">Please try again later.</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {user.role === 'farmer'
                          ? 'No customers have ordered your products yet.'
                          : 'You haven\'t placed any orders yet.'
                        }
                      </p>
                      <div className="mt-6">
                        {user.role === 'customer' ? (
                          <Link
                            href="/products"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Start Shopping
                          </Link>
                        ) : (
                          <button
                            onClick={() => setActiveTab('add-product')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Add Your First Product
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-hidden border-b border-gray-200 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Order ID
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Date
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Total
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Status
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {orders.map((order: Order) => (
                            <tr key={order.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                #{order.id.toString().slice(-8)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${order.totalAmount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {user.role === 'farmer' ? (
                                  <select
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                    disabled={order.status === 'delivered'}
                                    className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${
                                      order.status === 'delivered' ? 'opacity-75 cursor-not-allowed' : ''
                                    } ${getStatusColor(order.status)}`}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="preparing">Preparing</option>
                                    <option value="ready">Ready</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                ) : (
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                      order.status
                                    )}`}
                                  >
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link
                                  href={`/orders/${order.id}`}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  View Details
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="name"
                          defaultValue={user.name}
                          disabled
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-100 text-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          id="email"
                          defaultValue={user.email}
                          disabled
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-100 text-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        Account Type
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="role"
                          defaultValue={user.role}
                          disabled
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-100 text-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <div className="mt-1">
                        <input
                          type="tel"
                          id="phone"
                          defaultValue={user.phone || 'Not provided'}
                          disabled
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-100 text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="address"
                          rows={3}
                          defaultValue={user.address || 'Not provided'}
                          disabled
                          className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 rounded-md bg-gray-100 text-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      href="/profile"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Edit Profile
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === 'products' && user.role === 'farmer' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">My Products</h2>
                    <button
                      onClick={() => setActiveTab('add-product')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Product
                    </button>
                  </div>

                  {productsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                      <span className="ml-3 text-gray-600">Loading products...</span>
                    </div>
                  ) : productsError ? (
                    <div className="text-center py-12">
                      <div className="text-red-500 mb-2">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-semibold text-gray-700 mb-2">Failed to load products</h2>
                      <p className="text-gray-600">Please try again later.</p>
                    </div>
                  ) : farmerProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No products yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by adding your first product.
                      </p>
                      <div className="mt-6">
                        <button
                          onClick={() => setActiveTab('add-product')}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Your First Product
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {farmerProducts.map((product: Product) => (
                        <div key={product.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                          {/* Product Image */}
                          <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-48 object-cover"
                              />
                            ) : (
                              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 truncate">
                                  {product.name}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {product.description}
                                </p>
                              </div>
                              {product.organic && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                                  Organic
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <div>
                                <span className="text-2xl font-bold text-gray-900">
                                  ${product.price.toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-500 ml-1">
                                  per {product.unit}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  product.available
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {product.available ? 'Available' : 'Out of Stock'}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                  {product.quantity} {product.unit} left
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                              <span>{product.category}</span>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditProduct(product)}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="text-red-600 hover:text-red-800 text-xs font-medium"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'add-product' && user.role === 'farmer' && (
                <div className="bg-white rounded-lg shadow-md">
                  <ProductForm
                    onSuccess={() => setActiveTab('products')}
                    onCancel={() => setActiveTab('products')}
                  />
                </div>
              )}

              {activeTab === 'edit-product' && user.role === 'farmer' && editingProduct && (
                <div className="bg-white rounded-lg shadow-md">
                  <EditProductForm
                    product={editingProduct}
                    onSuccess={handleEditSuccess}
                    onCancel={handleEditCancel}
                  />
                </div>
              )}

              {activeTab === 'purchases' && user.role === 'farmer' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">My Purchases</h2>
                    <Link
                      href="/products"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Shop More
                    </Link>
                  </div>

                  {purchasesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                      <span className="ml-3 text-gray-600">Loading purchases...</span>
                    </div>
                  ) : purchasesError ? (
                    <div className="text-center py-12">
                      <div className="text-red-500 mb-2">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-semibold text-gray-700 mb-2">Failed to load purchases</h2>
                      <p className="text-gray-600">Please try again later.</p>
                    </div>
                  ) : purchases.length === 0 ? (
                    <div className="text-center py-12">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No purchases yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        You haven't purchased any products from other farmers yet.
                      </p>
                      <div className="mt-6">
                        <Link
                          href="/products"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          Browse Products
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-hidden border-b border-gray-200 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Order ID
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Date
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Total
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Payment Status
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Delivery Status
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {purchases.map((purchase: Order) => (
                            <tr key={purchase.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                #{purchase.id.toString().slice(-8)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(purchase.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${purchase.totalAmount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    purchase.paymentStatus === 'paid'
                                      ? 'bg-green-100 text-green-800'
                                      : purchase.paymentStatus === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : purchase.paymentStatus === 'failed'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {(purchase.paymentStatus || 'pending').charAt(0).toUpperCase() + (purchase.paymentStatus || 'pending').slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                    purchase.status
                                  )}`}
                                >
                                  {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link
                                  href={`/orders/${purchase.id}`}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  View Details
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Product</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this product? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center px-4 py-3 space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProduct}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
