// Simple test to check product IDs
const testProductIds = async () => {
  try {
    // Get products
    const productsResponse = await fetch('http://localhost:3000/api/products');
    if (!productsResponse.ok) {
      console.error('Failed to get products:', await productsResponse.text());
      return;
    }

    const productsData = await productsResponse.json();
    if (!productsData.products || productsData.products.length === 0) {
      console.error('No products available');
      return;
    }

    console.log('First product:', productsData.products[0]);
    console.log('Product ID:', productsData.products[0].id);
    console.log('Product ID type:', typeof productsData.products[0].id);
    console.log('Product ID length:', productsData.products[0].id.length);

    // Test the validation function
    const { validators } = await import('./src/lib/security.ts');
    console.log('Is valid ID?', validators.isValidId(productsData.products[0].id));

  } catch (error) {
    console.error('Test failed with error:', error);
  }
};

testProductIds();
