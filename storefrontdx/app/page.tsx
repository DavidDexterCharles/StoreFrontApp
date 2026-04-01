"use client";

import { useEffect, useMemo, useState } from "react";

type User = {
  name: string;
  email: string;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
};

type CartItem = {
  productId: string;
  quantity: number;
};

const SESSION_USER_KEY = "storefront-session-user";

const formatPrice = (value: number) => `$${value.toFixed(2)}`;

export default function Home() {
  const [account, setAccount] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [orderMessage, setOrderMessage] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(SESSION_USER_KEY);
    if (stored) {
      try {
        const user: User = JSON.parse(stored);
        setAccount(user);
        setMode("login");
      } catch {
        window.localStorage.removeItem(SESSION_USER_KEY);
      }
    }

    fetchProducts();
  }, []);

  useEffect(() => {
    if (account) {
      fetchCart(account.email);
    }
  }, [account]);

  const cartItems = useMemo(() => {
    return cart
      .map((item) => ({
        ...item,
        product: products.find((product) => product.id === item.productId),
      }))
      .filter((item) => item.product);
  }, [cart, products]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0,
  );

  async function fetchProducts() {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to load products.");
      const data: Product[] = await response.json();
      setProducts(data);
    } catch {
      setMessage("Unable to load products from the database.");
    }
  }

  async function fetchCart(userEmail: string) {
    try {
      const response = await fetch(
        `/api/cart?email=${encodeURIComponent(userEmail)}`,
      );
      if (!response.ok) throw new Error("Failed to load cart.");
      const items: CartItem[] = await response.json();
      setCart(items);
    } catch {
      setMessage("Unable to load your cart.");
    }
  }

  const persistSession = (user: User | null) => {
    if (user) {
      window.localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(SESSION_USER_KEY);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!name || !email || !password) {
      setMessage("Please complete all registration fields.");
      return;
    }

    try {
      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || "Registration failed.");
        return;
      }

      setMode("login");
      setMessage("Account created. You can now login.");
      setName("");
      setEmail("");
      setPassword("");
    } catch {
      setMessage("Registration failed.");
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("Please enter email and password.");
      return;
    }

    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || "Login failed.");
        return;
      }

      setAccount(data);
      persistSession(data);
      setMessage(`Welcome back, ${data.name}!`);
      setPassword("");
    } catch {
      setMessage("Login failed.");
    }
  };

  const handleLogout = () => {
    setAccount(null);
    persistSession(null);
    setCart([]);
    setMessage("You are logged out.");
  };

  const handleAddToCart = async (productId: string) => {
    setOrderMessage("");
    if (!account) {
      setMessage("Please login before adding products to your cart.");
      return;
    }

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: account.email, productId, quantity: 1 }),
      });

      if (!response.ok) throw new Error("Unable to add to cart.");
      const items: CartItem[] = await response.json();
      setCart(items);
      setMessage("Added item to cart.");
    } catch {
      setMessage("Unable to add item to cart.");
    }
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (!account) return;
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    try {
      const response = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: account.email, productId, quantity }),
      });
      if (!response.ok) throw new Error("Unable to update cart.");
      const items: CartItem[] = await response.json();
      setCart(items);
    } catch {
      setMessage("Unable to update cart quantity.");
    }
  };

  const handleRemoveFromCart = async (productId: string) => {
    if (!account) return;

    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: account.email, productId }),
      });
      if (!response.ok) throw new Error("Unable to remove item.");
      const items: CartItem[] = await response.json();
      setCart(items);
    } catch {
      setMessage("Unable to remove item from cart.");
    }
  };

  const handleCheckout = async () => {
    if (!cart.length) {
      setOrderMessage("Your cart is empty.");
      return;
    }
    if (!account) {
      setOrderMessage("Create an account before checkout.");
      return;
    }

    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: account.email }),
      });
      if (!response.ok) throw new Error("Checkout failed.");
      setCart([]);
      setOrderMessage(
        `Thank you for your purchase, ${account.name}! Your order total is ${formatPrice(subtotal)}.`,
      );
    } catch {
      setOrderMessage("Checkout could not be completed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
              Storefront Demo
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Shop, Cart, Checkout
            </h1>
          </div>
          <div className="space-y-2 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
            <p>
              {account
                ? `Signed in as ${account.name} (${account.email})`
                : "No account yet. Register to continue."}
            </p>
            {account ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700">
                Logout
              </button>
            ) : null}
          </div>
        </header>

        {message ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {message}
          </div>
        ) : null}

        {!account ? (
          <section className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setMessage("");
                  }}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    mode === "login"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200"
                  }`}>
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setMessage("");
                  }}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    mode === "register"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200"
                  }`}>
                  Register
                </button>
              </div>

              <div>
                <h2 className="mb-4 text-2xl font-semibold">
                  {mode === "login"
                    ? "Login to your account"
                    : "Create your account"}
                </h2>
                <form
                  className="space-y-4"
                  onSubmit={mode === "login" ? handleLogin : handleRegister}>
                  {mode === "register" ? (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Name
                      </label>
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                        placeholder="Your name"
                      />
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                      placeholder="Enter your password"
                    />
                  </div>

                  <button
                    type="submit"
                    className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                    {mode === "login" ? "Login" : "Register"}
                  </button>
                </form>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="mb-4 text-2xl font-semibold">
                  Why create an account?
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  Register once and keep your cart across refreshes. After
                  login, you can browse goods, add items to the cart, and
                  checkout.
                </p>
              </div>
            </aside>
          </section>
        ) : (
          <section className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-8">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="mb-4 text-2xl font-semibold">Available Goods</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {product.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-lg font-semibold text-slate-900">
                          {formatPrice(product.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product.id)}
                          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">Shopping Cart</h2>
                    <p className="text-sm text-slate-500">
                      Add products to see your cart.
                    </p>
                  </div>
                  <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                    {cartItems.length}
                  </div>
                </div>

                {cartItems.length ? (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div
                        key={item.product?.id}
                        className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {item.product?.name}
                            </h3>
                            <p className="text-sm text-slate-500">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-slate-900">
                              {formatPrice(
                                (item.product?.price || 0) * item.quantity,
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateQuantity(
                                item.productId,
                                item.quantity - 1,
                              )
                            }
                            className="rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateQuantity(
                                item.productId,
                                item.quantity + 1,
                              )
                            }
                            className="rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.productId)}
                            className="rounded-full border border-rose-200 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50">
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="rounded-3xl border border-slate-200 bg-white p-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Subtotal</span>
                        <span className="text-lg font-semibold text-slate-900">
                          {formatPrice(subtotal)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCheckout}
                        className="mt-6 w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                        Checkout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                    Your cart is empty.
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="mb-4 text-2xl font-semibold">Order status</h2>
                <p className="text-sm leading-6 text-slate-600">
                  {orderMessage || "Complete checkout to place your order."}
                </p>
              </div>
            </aside>
          </section>
        )}
      </div>
    </div>
  );
}
