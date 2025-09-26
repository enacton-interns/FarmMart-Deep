'use client';

import { Product } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';
import { toast } from 'react-toastify';

interface AddToCartButtonProps {
  product: Product & { isOwnProduct?: boolean };
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { user } = useAuth();
  const { addItem, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  // Check if this is the farmer's own product
  const isOwnProduct = product.isOwnProduct || false;

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please sign in to add items to your cart');
      return;
    }

    setIsAdding(true);

    try {
      // Add item to cart
      addItem(product, quantity);

      // Show success message
      toast.success(`${product.name} added to cart!`);

      // Open cart drawer
      openCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <label className="text-gray-700">Quantity:</label>
        <div className="flex items-center border border-gray-300 rounded-md">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100"
            disabled={quantity <= 1}
          >
            -
          </button>
          <span className="px-3 py-2">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100"
            disabled={quantity >= product.quantity}
          >
            +
          </button>
        </div>
        <span className="text-sm text-gray-500">
          {product.quantity} {product.unit} available
        </span>
      </div>
      
      {isOwnProduct ? (
        <div className="w-full py-3 px-4 rounded-md font-medium text-center bg-blue-100 text-blue-800 border border-blue-200">
          This is your product
        </div>
      ) : (
        <button
          onClick={handleAddToCart}
          disabled={isAdding || !product.available}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors duration-300 ${
            !product.available
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isAdding ? 'Adding...' : !product.available ? 'Out of Stock' : 'Add to Cart'}
        </button>
      )}
    </div>
  );
}
