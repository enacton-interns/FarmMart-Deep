// Simple validation utilities without external dependencies

// User validation schemas
export const validateRegister = (data: any) => {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (!data.email || typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email address');
  }
  
  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  if (!data.role || !['customer', 'farmer'].includes(data.role)) {
    errors.push('Invalid role');
  }
  
  if (data.address && typeof data.address !== 'string') {
    errors.push('Address must be a string');
  }
  
  if (data.phone && typeof data.phone !== 'string') {
    errors.push('Phone must be a string');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateLogin = (data: any) => {
  const errors: string[] = [];
  
  if (!data.email || typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email address');
  }
  
  if (!data.password || typeof data.password !== 'string' || data.password.length < 1) {
    errors.push('Password is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUpdateProfile = (data: any) => {
  const errors: string[] = [];
  
  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.length < 2)) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (data.email !== undefined && (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))) {
    errors.push('Invalid email address');
  }
  
  if (data.address !== undefined && typeof data.address !== 'string') {
    errors.push('Address must be a string');
  }
  
  if (data.phone !== undefined && typeof data.phone !== 'string') {
    errors.push('Phone must be a string');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Farmer validation schemas
export const validateFarmerProfile = (data: any) => {
  const errors: string[] = [];
  
  if (!data.farmName || typeof data.farmName !== 'string' || data.farmName.length < 2) {
    errors.push('Farm name must be at least 2 characters');
  }
  
  if (!data.farmDescription || typeof data.farmDescription !== 'string' || data.farmDescription.length < 10) {
    errors.push('Farm description must be at least 10 characters');
  }
  
  if (!data.farmLocation || typeof data.farmLocation !== 'object') {
    errors.push('Farm location is required');
  } else {
    const { address, city, state, zipCode } = data.farmLocation;
    
    if (!address || typeof address !== 'string' || address.length < 5) {
      errors.push('Address must be at least 5 characters');
    }
    
    if (!city || typeof city !== 'string' || city.length < 2) {
      errors.push('City must be at least 2 characters');
    }
    
    if (!state || typeof state !== 'string' || state.length < 2) {
      errors.push('State must be at least 2 characters');
    }
    
    if (!zipCode || typeof zipCode !== 'string' || zipCode.length < 5) {
      errors.push('Zip code must be at least 5 characters');
    }
  }
  
  if (data.farmSize !== undefined && (typeof data.farmSize !== 'number' || data.farmSize <= 0)) {
    errors.push('Farm size must be a positive number');
  }
  
  if (data.farmingPractices !== undefined && typeof data.farmingPractices !== 'string') {
    errors.push('Farming practices must be a string');
  }
  
  if (data.certifications !== undefined && (!Array.isArray(data.certifications) || !data.certifications.every((c: any) => typeof c === 'string'))) {
    errors.push('Certifications must be an array of strings');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Product validation schemas
export const validateCreateProduct = (data: any) => {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    errors.push('Product name must be at least 2 characters');
  }
  
  if (!data.description || typeof data.description !== 'string' || data.description.length < 10) {
    errors.push('Product description must be at least 10 characters');
  }
  
  if (!data.price || typeof data.price !== 'number' || data.price <= 0) {
    errors.push('Price must be a positive number');
  }
  
  if (!data.quantity || typeof data.quantity !== 'number' || data.quantity <= 0) {
    errors.push('Quantity must be a positive number');
  }
  
  if (!data.unit || typeof data.unit !== 'string' || data.unit.length < 1) {
    errors.push('Unit is required');
  }
  
  if (!data.category || !['fruits', 'vegetables', 'dairy', 'meat', 'bakery', 'other'].includes(data.category)) {
    errors.push('Invalid category');
  }
  
  if (data.images !== undefined && (!Array.isArray(data.images) || !data.images.every((img: any) => typeof img === 'string'))) {
    errors.push('Images must be an array of strings');
  }
  
  if (data.organic !== undefined && typeof data.organic !== 'boolean') {
    errors.push('Organic must be a boolean');
  }
  
  if (data.harvestDate !== undefined && !(data.harvestDate instanceof Date)) {
    errors.push('Harvest date must be a valid date');
  }
  
  if (data.available !== undefined && typeof data.available !== 'boolean') {
    errors.push('Available must be a boolean');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUpdateProduct = (data: any) => {
  const errors: string[] = [];
  
  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.length < 2)) {
    errors.push('Product name must be at least 2 characters');
  }
  
  if (data.description !== undefined && (typeof data.description !== 'string' || data.description.length < 10)) {
    errors.push('Product description must be at least 10 characters');
  }
  
  if (data.price !== undefined && (typeof data.price !== 'number' || data.price <= 0)) {
    errors.push('Price must be a positive number');
  }
  
  if (data.quantity !== undefined && (typeof data.quantity !== 'number' || data.quantity <= 0)) {
    errors.push('Quantity must be a positive number');
  }
  
  if (data.unit !== undefined && (typeof data.unit !== 'string' || data.unit.length < 1)) {
    errors.push('Unit is required');
  }
  
  if (data.category !== undefined && !['fruits', 'vegetables', 'dairy', 'meat', 'bakery', 'other'].includes(data.category)) {
    errors.push('Invalid category');
  }
  
  if (data.images !== undefined && (!Array.isArray(data.images) || !data.images.every((img: any) => typeof img === 'string'))) {
    errors.push('Images must be an array of strings');
  }
  
  if (data.organic !== undefined && typeof data.organic !== 'boolean') {
    errors.push('Organic must be a boolean');
  }
  
  if (data.harvestDate !== undefined && !(data.harvestDate instanceof Date)) {
    errors.push('Harvest date must be a valid date');
  }
  
  if (data.available !== undefined && typeof data.available !== 'boolean') {
    errors.push('Available must be a boolean');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Order validation schemas
export const validateCreateOrder = (data: any) => {
  const errors: string[] = [];
  
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('At least one item is required');
  } else {
    data.items.forEach((item: any, index: number) => {
      if (!item.productId || typeof item.productId !== 'string' || item.productId.length < 1) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be a positive number`);
      }
      
      if (!item.price || typeof item.price !== 'number' || item.price <= 0) {
        errors.push(`Item ${index + 1}: Price must be a positive number`);
      }
    });
  }
  
  if (!data.deliveryAddress || typeof data.deliveryAddress !== 'object') {
    errors.push('Delivery address is required');
  } else {
    const { address, city, state, zipCode } = data.deliveryAddress;
    
    if (!address || typeof address !== 'string' || address.length < 5) {
      errors.push('Address must be at least 5 characters');
    }
    
    if (!city || typeof city !== 'string' || city.length < 2) {
      errors.push('City must be at least 2 characters');
    }
    
    if (!state || typeof state !== 'string' || state.length < 2) {
      errors.push('State must be at least 2 characters');
    }
    
    if (!zipCode || typeof zipCode !== 'string' || zipCode.length < 5) {
      errors.push('Zip code must be at least 5 characters');
    }
  }
  
  if (data.deliveryDate !== undefined && !(data.deliveryDate instanceof Date)) {
    errors.push('Delivery date must be a valid date');
  }
  
  if (data.deliveryInstructions !== undefined && typeof data.deliveryInstructions !== 'string') {
    errors.push('Delivery instructions must be a string');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUpdateOrder = (data: any) => {
  const errors: string[] = [];
  
  if (data.status !== undefined && !['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].includes(data.status)) {
    errors.push('Invalid status');
  }
  
  if (data.paymentStatus !== undefined && !['pending', 'paid', 'failed', 'refunded'].includes(data.paymentStatus)) {
    errors.push('Invalid payment status');
  }
  
  if (data.deliveryDate !== undefined && !(data.deliveryDate instanceof Date)) {
    errors.push('Delivery date must be a valid date');
  }
  
  if (data.deliveryInstructions !== undefined && typeof data.deliveryInstructions !== 'string') {
    errors.push('Delivery instructions must be a string');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Notification validation schemas
export const validateCreateNotification = (data: any) => {
  const errors: string[] = [];
  
  if (!data.type || !['order_update', 'product_available', 'promotion', 'system'].includes(data.type)) {
    errors.push('Invalid notification type');
  }
  
  if (!data.title || typeof data.title !== 'string' || data.title.length < 2) {
    errors.push('Title must be at least 2 characters');
  }
  
  if (!data.message || typeof data.message !== 'string' || data.message.length < 5) {
    errors.push('Message must be at least 5 characters');
  }
  
  if (!data.userId || typeof data.userId !== 'string' || data.userId.length < 1) {
    errors.push('User ID is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitization function to prevent XSS
export const sanitizeInput = (input: any): any => {
  if (typeof input !== 'string') return input;
  
  return input.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Password strength validation
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, one uppercase, one lowercase, one number, one special character
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(password);
};