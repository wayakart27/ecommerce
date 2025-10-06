// app/sitemap.js
import { getAllCategories } from '@/actions/categories';
import { getProducts } from '@/actions/products';

const BASE_URL = 'https://pureluxury.com.ng';

// Helper function to get ALL products across all pages
async function getAllProducts() {
  let allProducts = [];
  let page = 1;
  let hasMore = true;
  const limit = 50; // Fetch more products per page to reduce API calls

  console.log('📄 Starting to fetch all products...');

  // Use a Set to track unique product IDs to avoid duplicates
  const seenProductIds = new Set();

  while (hasMore) {
    try {
      console.log(`📥 Fetching page ${page} with limit ${limit}...`);
      
      // Pass page and limit parameters correctly
      const response = await getProducts(page, limit, "", "");
      
      if (response?.products && Array.isArray(response.products)) {
        console.log(`✅ Got ${response.products.length} products from page ${page}`);
        
        // Filter out duplicates and add to allProducts
        const uniqueProducts = response.products.filter(product => {
          const productId = product.productId || product._id;
          if (seenProductIds.has(productId)) {
            console.log(`🔄 Skipping duplicate product: ${product.name} (${productId})`);
            return false;
          }
          seenProductIds.add(productId);
          return true;
        });
        
        allProducts = [...allProducts, ...uniqueProducts];
        
        // Check pagination - use the pagination info from your API response
        if (response.pagination) {
          console.log(`📊 Pagination: page ${response.pagination.page} of ${response.pagination.pages}, total: ${response.pagination.total}`);
          
          // Stop when we've reached the last page
          hasMore = page < response.pagination.pages;
          page++;
        } else {
          console.log('❌ No pagination info in response');
          hasMore = false;
        }
      } else {
        console.log('❌ No products found in response or invalid structure');
        hasMore = false;
      }
    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error);
      hasMore = false;
    }
  }

  console.log(`🎉 Finished fetching all products. Total unique: ${allProducts.length}`);
  return allProducts;
}

// Helper function to generate product URL
function generateProductUrl(product) {
  if (!product) return null;
  
  const slug = product.slug || product.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const id = product?.productId || product?._id;
  
  if (!slug || !id) {
    console.log('Missing slug or id for product:', product?.name);
    return null;
  }

  const productUrl = `${BASE_URL}/product/${slug}-${id}`;
  return productUrl;
}

// Helper function to extract categories from categories API response
function extractCategories(categoriesData) {
  if (!categoriesData || categoriesData.status !== 'fulfilled') return [];
  
  const categoriesResponse = categoriesData.value;
  
  // Handle different possible response structures
  if (Array.isArray(categoriesResponse)) {
    return categoriesResponse;
  } else if (categoriesResponse?.data && Array.isArray(categoriesResponse.data)) {
    return categoriesResponse.data;
  } else if (categoriesResponse?.success && Array.isArray(categoriesResponse.data)) {
    return categoriesResponse.data;
  }
  
  console.log('Unexpected categories response structure:', categoriesResponse);
  return [];
}

export default async function sitemap() {
  console.log('🚀 Sitemap generation started...');
  
  try {
    // Fetch all products across all pages and categories
    console.log('📡 Fetching all data...');
    
    const [allProducts, categoriesData] = await Promise.allSettled([
      getAllProducts(),
      getAllCategories?.().catch((error) => {
        console.error('Error fetching categories:', error);
        return [];
      })
    ]);

    const products = allProducts.status === 'fulfilled' ? allProducts.value : [];
    const categories = extractCategories(categoriesData);

    console.log(`📊 Found ${products.length} total products`);
    console.log(`📊 Found ${categories.length} categories`);

    // Log first few products to verify we're getting different ones
    if (products.length > 0) {
      console.log('First 3 product IDs:', products.slice(0, 3).map(p => p.productId || p._id));
    }

    // Static routes
    const staticRoutes = [
      {
        url: BASE_URL,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ];

    // Dynamic product routes - use Set to ensure uniqueness
    const productUrls = new Set();
    const productRoutes = products
      .map((product) => {
        const productUrl = generateProductUrl(product);
        if (!productUrl) return null;

        // Check for duplicates
        if (productUrls.has(productUrl)) {
          console.log(`🔄 Removing duplicate URL: ${productUrl}`);
          return null;
        }
        
        productUrls.add(productUrl);
        
        return {
          url: productUrl,
          lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        };
      })
      .filter(Boolean);

    console.log(`✅ Generated ${productRoutes.length} unique product routes`);

    // Category routes
    const categoryRoutes = categories
      .map(category => {
        const categorySlug = typeof category === 'string' ? category : category.slug || category.name;
        if (!categorySlug) return null;

        return {
          url: `${BASE_URL}/#products/${categorySlug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        };
      })
      .filter(Boolean);

    console.log(`✅ Generated ${categoryRoutes.length} category routes`);

    // Combine all routes
    const allRoutes = [
      ...staticRoutes,
      ...productRoutes,
      ...categoryRoutes,
    ];

    console.log(`🎯 Total unique routes in sitemap: ${allRoutes.length}`);

    // Final duplicate check (should be 0 if everything worked correctly)
    const finalUrls = new Set();
    const finalRoutes = allRoutes.filter(route => {
      if (finalUrls.has(route.url)) {
        console.log(`❌ Final duplicate found: ${route.url}`);
        return false;
      }
      finalUrls.add(route.url);
      return true;
    });

    if (finalRoutes.length !== allRoutes.length) {
      console.log(`🔄 Removed ${allRoutes.length - finalRoutes.length} final duplicates`);
    }

    return finalRoutes;

  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    
    // Return at least the basic routes even if there's an error
    return [
      {
        url: BASE_URL,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ];
  }
}