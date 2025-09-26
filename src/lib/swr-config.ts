import { SWRConfiguration } from 'swr';

export const swrConfig: SWRConfiguration = {
  // Revalidate every 30 seconds
  refreshInterval: 30000,

  // Revalidate on focus
  revalidateOnFocus: true,

  // Revalidate on reconnect
  revalidateOnReconnect: true,

  // Keep previous data while revalidating
  keepPreviousData: true,

  // Retry failed requests
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,

  // Custom fetcher with cookies
  fetcher: async (url: string) => {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies in requests
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};

// Cache keys for different data types
export const cacheKeys = {
  products: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return query ? `/api/products?${query}` : '/api/products';
  },

  product: (id: string) => `/api/products/${id}`,

  orders: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return query ? `/api/orders?${query}` : '/api/orders';
  },

  order: (id: string) => `/api/orders/${id}`,

  notifications: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return query ? `/api/notifications?${query}` : '/api/notifications';
  },

  user: '/api/auth/me',
};

// Cache invalidation helpers
export const invalidateCache = (cache: any, key: string) => {
  // Invalidate exact key
  cache.delete(key);

  // Invalidate keys that start with the same pattern
  for (const cacheKey of cache.keys()) {
    if (typeof cacheKey === 'string' && cacheKey.startsWith(key)) {
      cache.delete(cacheKey);
    }
  }
};

export const mutateData = async (mutate: any, key: string, newData?: any) => {
  if (newData) {
    // Update cache with new data
    await mutate(key, newData, false);
  } else {
    // Revalidate the data
    await mutate(key);
  }
};
