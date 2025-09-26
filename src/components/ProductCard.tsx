'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Product } from '@/types';
import { formatDate } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch like status and count when component mounts
    if (user) {
      fetchLikeStatus();
    }
    fetchLikeCount();
  }, [user, product.id]);

  const fetchLikeStatus = async () => {
    if (!user) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/products/${product.id}/like/status`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
      }
    } catch (error) {
      console.error('Error fetching like status:', error);
    }
  };

  const fetchLikeCount = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/products/${product.id}/like/count`);

      if (response.ok) {
        const data = await response.json();
        setLikeCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching like count:', error);
    }
  };

  const handleLikeToggle = async () => {
    if (!user) {
      // Redirect to sign in if not logged in
      window.location.href = '/auth/signin';
      return;
    }

    setIsLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`${baseUrl}/api/products/${product.id}/like`, {
        method,
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="relative h-48 bg-green-100">
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
          <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
            Organic
          </div>
        )}

        {/* Like Button */}
        <button
          onClick={handleLikeToggle}
          disabled={isLoading}
          className={`absolute top-2 left-2 p-2 rounded-full transition-colors duration-200 ${
            isLiked
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg className="h-5 w-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
          <span className="text-green-600 font-bold">${product.price.toFixed(2)}/{product.unit}</span>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-500">
            {product.quantity} {product.unit} available
          </span>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded capitalize">
            {product.category}
          </span>
        </div>
        
        <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
          <div>
            {product.harvestDate && (
              <span>Harvested: {formatDate(product.harvestDate)}</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <svg className="h-3 w-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{likeCount}</span>
          </div>
        </div>
        
        <Link 
          href={`/products/${product.id}`}
          className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded-md transition-colors duration-300"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
