import { Injectable, signal } from '@angular/core';
import { Product, CartItem } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = signal<CartItem[]>(this.loadCartFromStorage());

  getCartItems() {
    return this.cartItems.asReadonly();
  }

  addToCart(product: Product, quantity: number = 1) {
    const currentCart = this.cartItems();
    const existingItemIndex = currentCart.findIndex(item => item.product.id === product.id);

    if (existingItemIndex !== -1) {
      const updatedCart = [...currentCart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + quantity
      };
      this.cartItems.set(updatedCart);
    } else {
      const newItem: CartItem = {
        product,
        quantity,
        addedDate: new Date()
      };
      this.cartItems.set([...currentCart, newItem]);
    }

    this.saveCartToStorage();
    this.notifyCartUpdate();
  }

  removeFromCart(productId: string) {
    const updatedCart = this.cartItems().filter(item => item.product.id !== productId);
    this.cartItems.set(updatedCart);
    this.saveCartToStorage();
    this.notifyCartUpdate();
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const currentCart = this.cartItems();
    const updatedCart = currentCart.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    );
    this.cartItems.set(updatedCart);
    this.saveCartToStorage();
    this.notifyCartUpdate();
  }

  clearCart() {
    this.cartItems.set([]);
    this.saveCartToStorage();
    this.notifyCartUpdate();
  }

  getCartTotal() {
    return this.cartItems().reduce(
      (total, item) => total + (item.product.price * item.quantity), 
      0
    );
  }

  getCartCount() {
    return this.cartItems().reduce((count, item) => count + item.quantity, 0);
  }

  private loadCartFromStorage(): CartItem[] {
    try {
      const stored = localStorage.getItem('ecommerce-cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveCartToStorage() {
    localStorage.setItem('ecommerce-cart', JSON.stringify(this.cartItems()));
  }

  private notifyCartUpdate() {
    window.dispatchEvent(new CustomEvent('cartUpdate', {
      detail: {
        count: this.getCartCount(),
        total: this.getCartTotal(),
        items: this.cartItems()
      }
    }));
  }
}