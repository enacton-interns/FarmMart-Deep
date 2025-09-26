// Structured data (JSON-LD) for SEO

// Organization structured data
export const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FarmMarket',
  url: 'https://farmmarket.com',
  logo: 'https://farmmarket.com/logo.png',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-234-567-8900',
    contactType: 'customer service',
    email: 'info@farmmarket.com',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: '123 Farm Road',
    addressLocality: 'Countryside',
    addressRegion: 'State',
    postalCode: '12345',
    addressCountry: 'US',
  },
  sameAs: [
    'https://facebook.com/farmmarket',
    'https://twitter.com/farmmarket',
    'https://instagram.com/farmmarket',
  ],
};

// Website structured data
export const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'FarmMarket',
  url: 'https://farmmarket.com',
  description: 'Fresh local produce from farmers near you',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://farmmarket.com/products?search={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
  publisher: {
    '@type': 'Organization',
    name: 'FarmMarket',
    logo: {
      '@type': 'ImageObject',
      url: 'https://farmmarket.com/logo.png',
    },
  },
};

// Breadcrumb structured data
export const breadcrumbStructuredData = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

// Product structured data
export const productStructuredData = (product: any) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  image: product.images && product.images.length > 0 ? product.images[0] : '',
  description: product.description,
  sku: product._id,
  brand: {
    '@type': 'Brand',
    name: product.farmerName || 'Local Farmer',
  },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'USD',
    price: product.price,
    availability: product.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    seller: {
      '@type': 'Organization',
      name: product.farmerName || 'Local Farmer',
    },
  },
  aggregateRating: product.rating ? {
    '@type': 'AggregateRating',
    ratingValue: product.rating,
    reviewCount: product.reviewCount || 1,
  } : undefined,
});

// Local business structured data
export const localBusinessStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'FarmMarket',
  image: 'https://farmmarket.com/logo.png',
  url: 'https://farmmarket.com',
  telephone: '+1-234-567-8900',
  priceRange: '$$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '123 Farm Road',
    addressLocality: 'Countryside',
    addressRegion: 'State',
    postalCode: '12345',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 40.7128,
    longitude: -74.0060,
  },
  openingHours: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    opens: '08:00',
    closes: '20:00',
  },
};

// FAQ page structured data
export const faqPageStructuredData = (faqs: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

// How-to structured data
export const howToStructuredData = (data: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string; image?: string }>;
  totalTime?: string;
  estimatedCost?: string;
  supply?: string[];
  tool?: string[];
}) => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: data.name,
  description: data.description,
  totalTime: data.totalTime,
  estimatedCost: data.estimatedCost,
  supply: data.supply?.map(supply => ({
    '@type': 'HowToSupply',
    name: supply,
  })),
  tool: data.tool?.map(tool => ({
    '@type': 'HowToTool',
    name: tool,
  })),
  step: data.steps.map((step, index) => ({
    '@type': 'HowToStep',
    name: step.name,
    text: step.text,
    image: step.image ? {
      '@type': 'ImageObject',
      url: step.image,
    } : undefined,
  })),
});

// Recipe structured data
export const recipeStructuredData = (recipe: any) => ({
  '@context': 'https://schema.org',
  '@type': 'Recipe',
  name: recipe.name,
  image: recipe.image,
  description: recipe.description,
  keywords: recipe.keywords,
  recipeCategory: recipe.category,
  recipeCuisine: recipe.cuisine,
  nutrition: recipe.nutrition ? {
    '@type': 'NutritionInformation',
    calories: recipe.nutrition.calories,
    carbohydrateContent: recipe.nutrition.carbohydrateContent,
    cholesterolContent: recipe.nutrition.cholesterolContent,
    fatContent: recipe.nutrition.fatContent,
    fiberContent: recipe.nutrition.fiberContent,
    proteinContent: recipe.nutrition.proteinContent,
    saturatedFatContent: recipe.nutrition.saturatedFatContent,
    sodiumContent: recipe.nutrition.sodiumContent,
    sugarContent: recipe.nutrition.sugarContent,
    transFatContent: recipe.nutrition.transFatContent,
    unsaturatedFatContent: recipe.nutrition.unsaturatedFatContent,
  } : undefined,
  author: {
    '@type': 'Person',
    name: recipe.author,
  },
  datePublished: recipe.datePublished,
  prepTime: recipe.prepTime,
  cookTime: recipe.cookTime,
  totalTime: recipe.totalTime,
  recipeYield: recipe.recipeYield,
  recipeIngredient: recipe.ingredients,
  recipeInstructions: recipe.instructions.map((instruction: any, index: number) => ({
    '@type': 'HowToStep',
    text: instruction.text,
    name: `Step ${index + 1}`,
    url: `${recipe.url}#step${index + 1}`,
    image: instruction.image,
  })),
  aggregateRating: recipe.rating ? {
    '@type': 'AggregateRating',
    ratingValue: recipe.rating,
    reviewCount: recipe.reviewCount || 1,
  } : undefined,
});

// Event structured data
export const eventStructuredData = (event: any) => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: event.name,
  startDate: event.startDate,
  endDate: event.endDate,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: {
    '@type': 'Place',
    name: event.locationName,
    address: {
      '@type': 'PostalAddress',
      streetAddress: event.streetAddress,
      addressLocality: event.addressLocality,
      postalCode: event.postalCode,
      addressRegion: event.addressRegion,
      addressCountry: event.addressCountry,
    },
  },
  image: [event.image],
  description: event.description,
  offers: {
    '@type': 'Offer',
    url: event.url,
    price: event.price,
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    validFrom: event.validFrom,
  },
  performer: {
    '@type': 'PerformingGroup',
    name: event.performerName,
  },
  organizer: {
    '@type': 'Organization',
    name: event.organizerName,
    url: event.organizerUrl,
  },
});

// Article structured data
export const articleStructuredData = (article: any) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.headline,
  image: article.image,
  datePublished: article.datePublished,
  dateModified: article.dateModified,
  author: {
    '@type': 'Person',
    name: article.authorName,
  },
  publisher: {
    '@type': 'Organization',
    name: 'FarmMarket',
    logo: {
      '@type': 'ImageObject',
      url: 'https://farmmarket.com/logo.png',
    },
  },
  description: article.description,
});