"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "bazarwala_cart_v1";

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch (e) {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart, ready]);

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const exist = prev.find((c) => c.productId === product.id);
      if (exist) {
        const nextQty = Math.min(exist.qty + qty, product.stock);
        return prev.map((c) => (c.productId === product.id ? { ...c, qty: nextQty } : c));
      }
      return [...prev, { productId: product.id, qty: Math.min(qty, product.stock) }];
    });
  };
  const updateQty = (productId, qty, maxStock) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((c) => c.productId !== productId);
      return prev.map((c) => (c.productId === productId ? { ...c, qty: Math.min(qty, maxStock ?? qty) } : c));
    });
  };
  const removeItem = (productId) => setCart((prev) => prev.filter((c) => c.productId !== productId));
  const clearCart = () => setCart([]);
  const count = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQty, removeItem, clearCart, count, ready }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
