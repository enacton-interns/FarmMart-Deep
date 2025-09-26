// Simple test script to verify order creation fix
const testOrderCreation = async () => {
  try {
    // First, login to get token
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    const extractCookie = (header, name) => {
      if (!header) return null;
      const cookies = header.split(/,(?=[^;]+=[^;]+)/g);
      for (const raw of cookies) {
        const [cookieName, rest] = raw.trim().split('=');
        if (cookieName === name && rest) {
          return `${cookieName}=${rest.split(';')[0]}`;
        }
      }
      return null;
    };

    let authCookie = extractCookie(loginResponse.headers.get('set-cookie'), 'token');

    if (!loginResponse.ok || !authCookie) {
      console.log('Login failed, trying signup first...');

      // Try to signup first
      const signupResponse = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'customer',
          address: '123 Test St',
          phone: '1234567890',
        }),
      });

      if (!signupResponse.ok) {
        console.error('Signup failed:', await signupResponse.text());
        return;
      }

      // Now login
      const loginResponse2 = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      if (!loginResponse2.ok) {
        console.error('Login failed after signup:', await loginResponse2.text());
        return;
      }

      authCookie = extractCookie(loginResponse2.headers.get('set-cookie'), 'token');
      if (!authCookie) {
        console.error('Login succeeded but no auth cookie was returned');
        return;
      }
    } else {
      if (!authCookie) {
        authCookie = extractCookie(loginResponse.headers.get('set-cookie'), 'token');
        if (!authCookie) {
          console.error('Login succeeded but no auth cookie was returned');
          return;
        }
      }
      console.log('Login successful using secure cookie authentication');
    }

    // Get products to find a valid product ID
    const productsResponse = await fetch('http://localhost:3000/api/products');
    if (!productsResponse.ok) {
      console.error('Failed to get products:', await productsResponse.text());
      return;
    }

    const productsData = await productsResponse.json();
    if (!productsData.products || productsData.products.length === 0) {
      console.error('No products available for testing');
      return;
    }

    const product = productsData.products[0];
    console.log('Using product ID:', product.id, 'Type:', typeof product.id);

    // Now try to create an order
    const orderData = {
      items: [
        {
          productId: product.id,
          quantity: 1,
          price: product.price,
        }
      ],
      totalAmount: product.price,
      deliveryAddress: {
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345'
      },
      deliveryInstructions: 'Test order',
      paymentMethod: 'card',
      paymentStatus: 'pending'
    };

    console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

    const orderResponse = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
      },
      body: JSON.stringify(orderData),
    });

    console.log('Order creation response status:', orderResponse.status);

    const responseText = await orderResponse.text();
    console.log('Order creation response:', responseText);

    if (orderResponse.ok) {
      console.log('✅ Order creation successful!');
    } else {
      console.log('❌ Order creation failed');
    }

  } catch (error) {
    console.error('Test failed with error:', error);
  }
};

testOrderCreation();
