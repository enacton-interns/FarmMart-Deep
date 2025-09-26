'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import AddToCartButton from '@/components/AddToCartButton';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-toastify';

export default function ProductDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    unit: '',
    category: '',
    organic: false,
    harvestDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && productId) {
      fetchProduct();
    }
  }, [user, productId]);

  const fetchProduct = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/products/${productId}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        if (res.status === 404) {
          router.push('/products');
          return;
        }
        throw new Error('Failed to fetch product');
      }

      const data = await res.json();
      setProduct(data.product);
    } catch (error) {
      console.error('Error fetching product:', error);
      router.push('/products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = () => {
    setEditForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      unit: product.unit,
      category: product.category,
      organic: product.organic,
      harvestDate: product.harvestDate ? new Date(product.harvestDate).toISOString().split('T')[0] : '',
    });
    setIsEditing(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const response = await fetch(`${baseUrl}/api/products/${productId}`, {
        method: 'PUT',
        credentials: 'include',
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          price: parseFloat(editForm.price),
          quantity: parseInt(editForm.quantity),
          unit: editForm.unit,
          category: editForm.category,
          organic: editForm.organic,
          harvestDate: editForm.harvestDate || undefined,
          images: product.images, // Keep existing images
        }),
      });

      if (response.ok) {
        toast.success('Product updated successfully!');
        setIsEditing(false);
        fetchProduct(); // Refresh product data
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Product deleted successfully!');
        router.push('/dashboard?tab=products');
      } else {
        const error = await response.json();
        toast.error(`Error deleting product: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user || !product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative h-80 bg-green-100 rounded-lg overflow-hidden">
                {product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-green-200">
                    <span className="text-green-800 font-medium">No Image</span>
                  </div>
                )}
                
                {product.organic && (
                  <div className="absolute top-4 right-4 bg-green-600 text-white text-sm font-bold px-3 py-1 rounded">
                    Organic
                  </div>
                )}
              </div>
              
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1, 5).map((image: string, index: number) => (
                    <div key={index} className="relative h-20 bg-green-100 rounded-md overflow-hidden">
                      <Image
                        src={image}
                        alt={`${product.name} ${index + 2}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
                  <span className="text-2xl font-bold text-green-600">${product.price.toFixed(2)}/{product.unit}</span>
                </div>
                
                <div className="flex items-center space-x-4 mb-4">
                  <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full capitalize">
                    {product.category}
                  </span>
                  <span className="text-gray-600">
                    {product.quantity} {product.unit} available
                  </span>
                </div>
                
                {product.harvestDate && (
                  <p className="text-sm text-gray-500 mb-4">
                    Harvested on: {formatDate(product.harvestDate)}
                  </p>
                )}
              </div>
              
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Description</h2>
                <p className="text-gray-600">{product.description}</p>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Farm Information</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800">{product.farmerName}</h3>
                  {product.farmerDescription && (
                    <p className="text-gray-600 text-sm mt-1">{product.farmerDescription}</p>
                  )}
                  {product.farmerLocation && (
                    <p className="text-gray-600 text-sm mt-2">
                      {product.farmerLocation.city}, {product.farmerLocation.state}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                {isEditing ? (
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          id="edit-name"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                        />
                      </div>
                      <div>
                        <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700 mb-1">
                          Price per Unit *
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                          <input
                            type="number"
                            id="edit-price"
                            value={editForm.price}
                            onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                            required
                            min="0"
                            step="0.01"
                            className="block w-full pl-8 border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="edit-quantity" className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity Available *
                        </label>
                        <input
                          type="number"
                          id="edit-quantity"
                          value={editForm.quantity}
                          onChange={(e) => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
                          required
                          min="1"
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                        />
                      </div>
                      <div>
                        <label htmlFor="edit-unit" className="block text-sm font-medium text-gray-700 mb-1">
                          Unit *
                        </label>
                        <select
                          id="edit-unit"
                          value={editForm.unit}
                          onChange={(e) => setEditForm(prev => ({ ...prev, unit: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                        >
                          <option value="lb">Pounds (lb)</option>
                          <option value="kg">Kilograms (kg)</option>
                          <option value="oz">Ounces (oz)</option>
                          <option value="liters">Liters (L)</option>
                          <option value="piece">Pieces</option>
                          <option value="bunch">Bunches</option>
                          <option value="dozen">Dozen</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-1">
                          Category *
                        </label>
                        <select
                          id="edit-category"
                          value={editForm.category}
                          onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                        >
                          <option value="fruits">Fruits</option>
                          <option value="vegetables">Vegetables</option>
                          <option value="dairy">Dairy</option>
                          <option value="meat">Meat</option>
                          <option value="bakery">Bakery</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="edit-harvestDate" className="block text-sm font-medium text-gray-700 mb-1">
                          Harvest Date (Optional)
                        </label>
                        <input
                          type="date"
                          id="edit-harvestDate"
                          value={editForm.harvestDate}
                          onChange={(e) => setEditForm(prev => ({ ...prev, harvestDate: e.target.value }))}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <textarea
                        id="edit-description"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        required
                        rows={3}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="edit-organic"
                        checked={editForm.organic}
                        onChange={(e) => setEditForm(prev => ({ ...prev, organic: e.target.checked }))}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="edit-organic" className="ml-2 block text-sm text-gray-900">
                        Organic Product
                      </label>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md font-medium transition-colors duration-300 flex items-center justify-center disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Update Product
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : product.isOwnProduct ? (
                  <div className="flex space-x-4">
                    <button
                      onClick={handleEditClick}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium transition-colors duration-300 flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Product
                    </button>
                    <button
                      onClick={handleDeleteClick}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md font-medium transition-colors duration-300 flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Product
                    </button>
                  </div>
                ) : (
                  <AddToCartButton product={product} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Product</h3>
              <div className="mb-6">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete <strong>"{product.name}"</strong>? This action cannot be undone and all associated data will be permanently removed.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete Product'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
