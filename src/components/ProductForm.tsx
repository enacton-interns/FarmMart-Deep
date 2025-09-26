'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';

interface ProductFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface EditProductFormProps {
  product: {
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
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductForm({ onSuccess, onCancel }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [currentUrlInput, setCurrentUrlInput] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    unit: 'lb',
    category: 'vegetables',
    organic: false,
    harvestDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        newImages.push(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newPreviews.push(e.target.result as string);
            setImagePreviews([...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    setSelectedImages([...selectedImages, ...newImages]);
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const addImageUrl = () => {
    if (currentUrlInput.trim() && !imageUrls.includes(currentUrlInput.trim())) {
      setImageUrls([...imageUrls, currentUrlInput.trim()]);
      setCurrentUrlInput('');
    }
  };

  const removeImageUrl = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
  };

  const handleUrlKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addImageUrl();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      // Combine uploaded images (convert to base64) and URL images
      const uploadedImagePromises = selectedImages.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const uploadedImages = await Promise.all(uploadedImagePromises);
      const allImages = [...uploadedImages, ...imageUrls];

      const response = await fetch(`${baseUrl}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
          unit: formData.unit,
          category: formData.category,
          organic: formData.organic,
          harvestDate: formData.harvestDate || undefined,
          images: allImages,
        }),
      });

      if (response.ok) {
        toast.success('Product added successfully!');
        onSuccess();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Add New Product</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Back to Products
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Name */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
              placeholder="e.g., Organic Tomatoes"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
              placeholder="Describe your product, its freshness, origin, etc."
            />
          </div>

          {/* Price and Quantity */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price per Unit *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input
                type="number"
                id="price"
                name="price"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="block w-full pl-8 border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity Available *
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              required
              min="1"
              value={formData.quantity}
              onChange={handleChange}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
              placeholder="100"
            />
          </div>

          {/* Unit and Category */}
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
              Unit *
            </label>
            <select
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
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
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
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

          {/* Harvest Date */}
          <div>
            <label htmlFor="harvestDate" className="block text-sm font-medium text-gray-700 mb-1">
              Harvest/Pick Date (Optional)
            </label>
            <input
              type="date"
              id="harvestDate"
              name="harvestDate"
              value={formData.harvestDate}
              onChange={handleChange}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
            />
          </div>

          {/* Organic Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="organic"
              name="organic"
              checked={formData.organic}
              onChange={handleChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="organic" className="ml-2 block text-sm text-gray-900">
              Organic Product
            </label>
          </div>
        </div>

        {/* Product Images */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images (Optional)
          </label>

          {/* Image Input Mode Tabs */}
          <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setImageInputMode('upload')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                imageInputMode === 'upload'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📁 Upload Files
            </button>
            <button
              type="button"
              onClick={() => setImageInputMode('url')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                imageInputMode === 'url'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🔗 Image URLs
            </button>
          </div>

          {/* Upload Mode */}
          {imageInputMode === 'upload' && (
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="mt-4">
                  <label htmlFor="images" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Upload product images
                    </span>
                    <input
                      id="images"
                      name="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </div>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Uploaded Images:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* URL Mode */}
          {imageInputMode === 'url' && (
            <div>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={currentUrlInput}
                    onChange={(e) => setCurrentUrlInput(e.target.value)}
                    onKeyPress={handleUrlKeyPress}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                  />
                  <button
                    type="button"
                    onClick={addImageUrl}
                    disabled={!currentUrlInput.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Enter image URLs one by one. Press Enter or click Add to include them.
                </p>
              </div>

              {/* URL Previews */}
              {imageUrls.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Image URLs:</h4>
                  <div className="space-y-2">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                        <img
                          src={url}
                          alt={`URL image ${index + 1}`}
                          className="w-12 h-12 object-cover rounded border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjE2QzE0IDE3LjEgMTMuMSAxOCA5IDE4QzYuOSAxOCA2IDE3LjEgNiAxNlY0QzYgMi45IDYuOSAyIDggMkgxNkMxNy4xIDIgMTggMi45IDE4IDRWMTJDMTggMTMuMSAxNy4xIDE0IDE2IDE0SDE0QzEyLjkgMTQgMTIgMTMuMSAxMiAxMloiIHN0cm9rZT0iIzk3OTc5NyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTEyIDIwVjIyIiBzdHJva2U9IiM5Nzk3OTciIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{url}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImageUrl(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding Product...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditProductForm({ product, onSuccess, onCancel }: EditProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(product.images || []);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [currentUrlInput, setCurrentUrlInput] = useState('');
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description,
    price: product.price.toString(),
    quantity: product.quantity.toString(),
    unit: product.unit,
    category: product.category,
    organic: product.organic,
    harvestDate: product.harvestDate ? new Date(product.harvestDate).toISOString().split('T')[0] : '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        newImages.push(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newPreviews.push(e.target.result as string);
            setImagePreviews([...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    setSelectedImages([...selectedImages, ...newImages]);
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const addImageUrl = () => {
    if (currentUrlInput.trim() && !imageUrls.includes(currentUrlInput.trim())) {
      setImageUrls([...imageUrls, currentUrlInput.trim()]);
      setCurrentUrlInput('');
    }
  };

  const removeImageUrl = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
  };

  const handleUrlKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addImageUrl();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      // Combine uploaded images (convert to base64) and URL images
      const uploadedImagePromises = selectedImages.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const uploadedImages = await Promise.all(uploadedImagePromises);
      const allImages = [...uploadedImages, ...imageUrls];

      const response = await fetch(`${baseUrl}/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
          unit: formData.unit,
          category: formData.category,
          organic: formData.organic,
          harvestDate: formData.harvestDate || undefined,
          images: allImages,
        }),
      });

      if (response.ok) {
        toast.success('Product updated successfully!');
        onSuccess();
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Edit Product</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Back to Products
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Name */}
          <div className="md:col-span-2">
            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              id="edit-name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
              placeholder="e.g., Organic Tomatoes"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="edit-description"
              name="description"
              required
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
              placeholder="Describe your product, its freshness, origin, etc."
            />
          </div>

          {/* Price and Quantity */}
          <div>
            <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700 mb-1">
              Price per Unit *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input
                type="number"
                id="edit-price"
                name="price"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="block w-full pl-8 border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                placeholder="0.00"
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
              name="quantity"
              required
              min="1"
              value={formData.quantity}
              onChange={handleChange}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
              placeholder="100"
            />
          </div>

          {/* Unit and Category */}
          <div>
            <label htmlFor="edit-unit" className="block text-sm font-medium text-gray-700 mb-1">
              Unit *
            </label>
            <select
              id="edit-unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
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
              name="category"
              value={formData.category}
              onChange={handleChange}
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

          {/* Harvest Date */}
          <div>
            <label htmlFor="edit-harvestDate" className="block text-sm font-medium text-gray-700 mb-1">
              Harvest/Pick Date (Optional)
            </label>
            <input
              type="date"
              id="edit-harvestDate"
              name="harvestDate"
              value={formData.harvestDate}
              onChange={handleChange}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
            />
          </div>

          {/* Organic Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="edit-organic"
              name="organic"
              checked={formData.organic}
              onChange={handleChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="edit-organic" className="ml-2 block text-sm text-gray-900">
              Organic Product
            </label>
          </div>
        </div>

        {/* Product Images */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images (Optional)
          </label>

          {/* Image Input Mode Tabs */}
          <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setImageInputMode('upload')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                imageInputMode === 'upload'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📁 Upload Files
            </button>
            <button
              type="button"
              onClick={() => setImageInputMode('url')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                imageInputMode === 'url'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🔗 Image URLs
            </button>
          </div>

          {/* Upload Mode */}
          {imageInputMode === 'upload' && (
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="mt-4">
                  <label htmlFor="edit-images" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Upload additional product images
                    </span>
                    <input
                      id="edit-images"
                      name="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </div>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">New Uploaded Images:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* URL Mode */}
          {imageInputMode === 'url' && (
            <div>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={currentUrlInput}
                    onChange={(e) => setCurrentUrlInput(e.target.value)}
                    onKeyPress={handleUrlKeyPress}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 p-3"
                  />
                  <button
                    type="button"
                    onClick={addImageUrl}
                    disabled={!currentUrlInput.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Enter image URLs one by one. Press Enter or click Add to include them.
                </p>
              </div>

              {/* URL Previews */}
              {imageUrls.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">All Images:</h4>
                  <div className="space-y-2">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                        <img
                          src={url}
                          alt={`URL image ${index + 1}`}
                          className="w-12 h-12 object-cover rounded border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjE2QzE0IDE3LjEgMTMuMSAxOCA5IDE4QzYuOSAxOCA2IDE3LjEgNiAxNlY0QzYgMi45IDYuOSAyIDggMkgxNkMxNy4xIDIgMTggMi45IDE4IDRWMTJDMTggMTMuMSAxNy4xIDE0IDE2IDE0SDE0QzEyLjkgMTQgMTIgMTMuMSAxMiAxMloiIHN0cm9rZT0iIzk3OTc5NyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTEyIDIwVjIyIiBzdHJva2U9IiM5Nzk3OTciIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{url}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImageUrl(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating Product...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Update Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
