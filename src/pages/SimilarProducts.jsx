// components/SimilarProducts.jsx
import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * Similar Products Component
 * Fetches and displays products from the same category or random products
 */
const SimilarProducts = ({ currentProductId, category, limit = 6 }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimilarProducts();
  }, [currentProductId, category]);

  const fetchSimilarProducts = async () => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams({
        limit: (limit * 2).toString(), // Fetch more to filter current product
        isActive: 'true',
        sortBy: 'createdAt',
        order: 'desc',
      });

      // Add category filter if available
      if (category) {
        params.append('category', category);
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Filter out current product and shuffle for randomness
        let filtered = data.data.filter(p => (p._id || p.id) !== currentProductId);
        
        // Shuffle array for random selection
        filtered = shuffleArray(filtered);
        
        // Take only the required number
        setProducts(filtered.slice(0, limit));
      }
    } catch (error) {
      console.error('Error fetching similar products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fisher-Yates shuffle algorithm
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleImageError = (e) => {
    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f5f5f5" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
  };

  if (loading) {
    return (
      <div className="similar-products">
        <h3 className="section-title">Loading Similar Products...</h3>
        <div className="products-grid">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="product-card skeleton">
              <div className="skeleton-image"></div>
            </div>
          ))}
        </div>

        <style jsx>{`
          .similar-products {
            padding: 16px;
            background: #fff;
            margin-top: 8px;
          }
          
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #333;
            margin-bottom: 12px;
          }
          
          .products-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          
          .product-card {
            aspect-ratio: 1;
            border-radius: 6px;
            overflow: hidden;
            background: #f8f8f8;
            border: 1px solid #efefef;
          }
          
          .skeleton-image {
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }
          
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  if (products.length === 0) {
    return null; // Don't show section if no products
  }

  return (
    <div className="similar-products">
      <h3 className="section-title">{products.length} Similar Products</h3>
      <div className="products-grid">
        {products.map((product) => (
          <Link 
            href={`/product/${product._id || product.id}`} 
            key={product._id || product.id}
            className="product-link"
          >
            <div className="product-card">
              <img 
                src={product.mainImage || product.images?.[0] || ''} 
                alt={product.title || product.title2 || 'Product'} 
                onError={handleImageError}
              />
              <div className="product-overlay">
                <div className="product-price">₹{product.sellingPrice || product.price}</div>
                {product.discount > 0 && (
                  <div className="product-discount">{product.discount}% OFF</div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .similar-products {
          padding: 16px;
          background: #fff;
          margin-top: 8px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
        }
        
        .products-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        
        .product-link {
          text-decoration: none;
          display: block;
        }
        
        .product-card {
          position: relative;
          aspect-ratio: 1;
          border-radius: 6px;
          width: 100%;
          overflow: hidden;
          background: #f8f8f8;
          border: 1px solid #efefef;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .product-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .product-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
          padding: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .product-card:hover .product-overlay {
          opacity: 1;
        }
        
        .product-price {
          color: white;
          font-size: 13px;
          font-weight: 600;
        }
        
        .product-discount {
          background: #ff4444;
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
        }
        
        @media (max-width: 480px) {
          .products-grid {
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default SimilarProducts;