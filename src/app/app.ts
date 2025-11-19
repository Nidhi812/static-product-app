/**
 * ═══════════════════════════════════════════════════════════════════════
 *                          PRODUCTS MICROFRONTEND
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * This is the main component of the products microfrontend, responsible for:
 * 
 * • Product catalog display with images and pricing
 * • Search and filtering functionality
 * • Product detail views
 * • Add to cart functionality via shared CartService
 * • Category-based navigation
 * 
 * Module Federation Integration:
 * • This component is exposed as './Component' in webpack config
 * • Can be consumed by the shell-app as a remote module
 * • Shares state with other microfrontends through CartService
 * • Maintains independence while participating in larger application
 */

import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// SHARED TYPES AND SERVICES
// Note: In a real application, these would be imported from a shared library
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  tags: string[];
  brand: string;
}

// MOCK CART SERVICE (In real app, this would be injected from shell)
class CartService {
  private items: any[] = [];
  
  addToCart(product: Product, quantity: number = 1) {
    console.log('🛒 Adding to cart:', product.name, 'x', quantity);
    // In real app, this would communicate with the shared CartService
    // For demo purposes, we'll use localStorage
    const currentCart = JSON.parse(localStorage.getItem('ecommerce_cart') || '[]');
    const existingItemIndex = currentCart.findIndex((item: any) => item.product.id === product.id);
    
    if (existingItemIndex >= 0) {
      currentCart[existingItemIndex].quantity += quantity;
    } else {
      currentCart.push({ product, quantity, addedDate: new Date() });
    }
    
    localStorage.setItem('ecommerce_cart', JSON.stringify(currentCart));
    
    // Dispatch custom event to notify shell app
    window.dispatchEvent(new CustomEvent('cartUpdated', { 
      detail: { count: currentCart.reduce((sum: number, item: any) => sum + item.quantity, 0) }
    }));
  }
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- PRODUCTS HEADER -->
    <div class="products-header">
      <div class="container">
        <h1 class="page-title">
          🛍️ Product Catalog
          <span class="subtitle">Discover amazing products</span>
        </h1>
        
        <!-- SEARCH AND FILTERS -->
        <div class="search-filters">
                    <div class="search-box">
            <input 
              type="text" 
              placeholder="Search products..."
              [ngModel]="searchTerm()"
              (input)="onSearchChange($event)"
              class="search-input">
            <span class="search-icon">🔍</span>
          </div>
          
          <select [ngModel]="selectedCategory()" (change)="onCategoryChange($event)" class="category-select">
            <option value="">All Categories</option>
            @for (category of categories(); track category) {
              <option [value]="category">{{ category }}</option>
            }
          </select>
          
          <!-- SORT SELECT (added closing tag + options to fix template error) -->
          <select [ngModel]="sortBy()" (change)="onSortChange($event)" class="sort-select">
            <option value="name">Name (A → Z)</option>
            <option value="price">Price (Low → High)</option>
            <option value="price-desc">Price (High → Low)</option>
            <option value="rating">Rating</option>
          </select>
        </div>
        
        <!-- RESULTS INFO -->
        <div class="results-info">
          Showing {{ filteredProducts().length }} of {{ products().length }} products
        </div>
      </div>
    </div>

    <!-- PRODUCTS GRID -->
    <div class="products-container">
      <div class="container">
        @if (filteredProducts().length === 0) {
          <!-- NO PRODUCTS FOUND -->
          <div class="no-products">
            <div class="no-products-icon">📦</div>
            <h3>No products found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        } @else {
          <!-- PRODUCTS GRID -->
          <div class="products-grid">
            @for (product of filteredProducts(); track product.id) {
              <div class="product-card" [class.out-of-stock]="!product.inStock">
                
                <!-- PRODUCT IMAGE -->
                <div class="product-image">
                  <img [src]="product.imageUrl" [alt]="product.name" />
                  @if (!product.inStock) {
                    <div class="out-of-stock-overlay">Out of Stock</div>
                  }
                  @if (product.originalPrice && product.originalPrice > product.price) {
                    <div class="discount-badge">
                      {{ getDiscountPercentage(product) }}% OFF
                    </div>
                  }
                </div>
                
                <!-- PRODUCT INFO -->
                <div class="product-info">
                  <div class="product-category">{{ product.category }}</div>
                  <h3 class="product-name">{{ product.name }}</h3>
                  <p class="product-description">{{ product.description }}</p>
                  
                  <!-- RATING -->
                  <div class="product-rating">
                    <div class="stars">
                      @for (star of getStarArray(product.rating); track $index) {
                        <span class="star" [class.filled]="star">⭐</span>
                      }
                    </div>
                    <span class="rating-text">{{ product.rating }} ({{ product.reviewCount }} reviews)</span>
                  </div>
                  
                  <!-- PRICE -->
                  <div class="product-price">
                    <span class="current-price">\${{ product.price.toFixed(2) }}</span>
                    @if (product.originalPrice && product.originalPrice > product.price) {
                      <span class="original-price">\${{ product.originalPrice.toFixed(2) }}</span>
                    }
                  </div>
                  
                  <!-- TAGS -->
                  <div class="product-tags">
                    @for (tag of product.tags; track tag) {
                      <span class="tag">{{ tag }}</span>
                    }
                  </div>
                  
                  <!-- ADD TO CART BUTTON -->
                  <button 
                    class="add-to-cart-btn"
                    [disabled]="!product.inStock"
                    (click)="addToCart(product)">
                    @if (product.inStock) {
                      🛒 Add to Cart
                    } @else {
                      Out of Stock
                    }
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  
  // REACTIVE STATE
  protected readonly title = signal('products-app');
  protected readonly products = signal<Product[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly selectedCategory = signal('');
  protected readonly sortBy = signal('name');
  
  // COMPUTED VALUES  
  protected readonly categories = computed(() => {
    const cats = [...new Set(this.products().map(p => p.category))];
    return cats.sort();
  });
  
  protected readonly filteredProducts = computed(() => {
    let filtered = this.products();
    
    // Apply search filter
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    // Apply category filter
    if (this.selectedCategory()) {
      filtered = filtered.filter(p => p.category === this.selectedCategory());
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.sortBy()) {
        case 'price':
          return a.price - b.price;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    return filtered;
  });
  
  // SERVICES
  private cartService = new CartService();

  ngOnInit() {
    console.log('🛍️ Products App initialized');
    this.loadProducts();
  }

  /**
   * LOAD MOCK PRODUCT DATA
   * 
   * In a real application, this would fetch from an API
   */
  private loadProducts() {
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Wireless Bluetooth Headphones',
        description: 'Premium noise-canceling headphones with 30-hour battery life',
        price: 199.99,
        originalPrice: 249.99,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        category: 'Electronics',
        rating: 4.5,
        reviewCount: 1203,
        inStock: true,
        tags: ['wireless', 'bluetooth', 'noise-canceling'],
        brand: 'TechPro'
      },
      {
        id: '2',
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable, sustainable t-shirt made from 100% organic cotton',
        price: 29.99,
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        category: 'Clothing',
        rating: 4.2,
        reviewCount: 856,
        inStock: true,
        tags: ['organic', 'cotton', 'sustainable'],
        brand: 'EcoWear'
      },
      {
        id: '3',
        name: 'Smart Fitness Watch',
        description: 'Track your health and fitness with this advanced smartwatch',
        price: 299.99,
        originalPrice: 349.99,
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        category: 'Electronics',
        rating: 4.7,
        reviewCount: 2134,
        inStock: true,
        tags: ['smartwatch', 'fitness', 'health'],
        brand: 'FitTech'
      },
      {
        id: '4',
        name: 'Artisan Coffee Beans',
        description: 'Single-origin coffee beans roasted to perfection',
        price: 24.99,
        imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
        category: 'Food & Beverage',
        rating: 4.8,
        reviewCount: 567,
        inStock: true,
        tags: ['coffee', 'organic', 'single-origin'],
        brand: 'RoastMaster'
      },
      {
        id: '5',
        name: 'Yoga Mat Premium',
        description: 'Non-slip yoga mat perfect for all types of exercise',
        price: 59.99,
        imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
        category: 'Sports & Fitness',
        rating: 4.4,
        reviewCount: 789,
        inStock: false,
        tags: ['yoga', 'exercise', 'non-slip'],
        brand: 'ZenFit'
      },
      {
        id: '6',
        name: 'Leather Messenger Bag',
        description: 'Handcrafted leather bag perfect for work and travel',
        price: 149.99,
        originalPrice: 199.99,
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
        category: 'Accessories',
        rating: 4.6,
        reviewCount: 432,
        inStock: true,
        tags: ['leather', 'handcrafted', 'messenger'],
        brand: 'CraftLeather'
      }
    ];
    
    this.products.set(mockProducts);
  }

  /**
   * EVENT HANDLERS FOR FILTERING AND SEARCH
   */
  onSearchChange(event: any) {
    this.searchTerm.set(event.target.value);
  }

  onCategoryChange(event: any) {
    this.selectedCategory.set(event.target.value);
  }

  onSortChange(event: any) {
    this.sortBy.set(event.target.value);
  }

  /**
   * ADD PRODUCT TO CART
   * 
   * This method demonstrates communication between microfrontends
   */
  addToCart(product: Product) {
    this.cartService.addToCart(product);
    
    // Show success feedback
    this.showAddToCartFeedback(product.name);
  }

  /**
   * UTILITY METHODS
   */
  getDiscountPercentage(product: Product): number {
    if (!product.originalPrice) return 0;
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  }

  getStarArray(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.floor(rating));
  }

  private showAddToCartFeedback(productName: string) {
    // Create temporary success message
    const message = document.createElement('div');
    message.textContent = `✅ ${productName} added to cart!`;
    message.className = 'cart-success-message';
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 3000);
  }
}
