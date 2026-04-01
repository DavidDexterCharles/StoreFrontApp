"use client";

import { useEffect, useMemo, useState } from "react";

type User = {
  name: string;
  email: string;
  password: string;
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

const PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Classic Sneakers",
    description: "Comfortable everyday sneakers in white.",
    price: 59.99,
  },
  {
    id: "prod-2",
    name: "Denim Jacket",
    description: "Stylish denim jacket with a relaxed fit.",
    price: 79.99,
  },
  {
    id: "prod-3",
    name: "Wireless Headphones",
    description: "Noise-reducing headphones with long battery life.",
    price: 129.99,
  },
  {
    id: "prod-4",
    name: "Leather Wallet",
    description: "Slim, durable wallet with several card slots.",
    price: 34.99,
  },
  {
    id: "prod-5",
    name: "Travel Backpack",
    description: "Lightweight backpack with laptop compartment.",
    price: 69.99,
  },
];

const USER_KEY = "storefront-user";
const CART_KEY = "storefront-cart";
const SESSION_KEY = "storefront-session";

const formatPrice = (value: number) => `$${value.toFixed(2)}`;

export default function Home() {
  const [storedUser, setStoredUser] = useState<User | null>(null);
  const [account, setAccount] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [orderMessage, setOrderMessage] = useState("");

  useEffect(() => {
    const savedUser = window.localStorage.getItem(USER_KEY);
    const savedCart = window.localStorage.getItem(CART_KEY);
    const savedSession = window.localStorage.getItem(SESSION_KEY);

    if (savedUser) {
      try {
        const parsedUser: User = JSON.parse(savedUser);
        setStoredUser(parsedUser);
        setMode("login");
        if (savedSession === "true") {
          setAccount(parsedUser);
        }
      } catch {
        window.localStorage.removeItem(USER_KEY);
        window.localStorage.removeItem(SESSION_KEY);
      }
    }

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        window.localStorage.removeItem(CART_KEY);
      }
    }
  }, []);

  const cartItems = useMemo(() => {
    return cart
      .map((item) => ({
        ...item,
        product: PRODUCTS.find((product) => product.id === item.productId),
      }))
      .filter((item) => item.product);
  }, [cart]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0,
  );

  const saveStoredUser = (user: User | null) => {
    if (user) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
      setStoredUser(user);
    } else {
      window.localStorage.removeItem(USER_KEY);
      window.localStorage.removeItem(SESSION_KEY);
      setStoredUser(null);
    }
  };

  const saveSession = (signedIn: boolean) => {
    if (signedIn) {
      window.localStorage.setItem(SESSION_KEY, "true");
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  };

  const saveCart = (items: CartItem[]) => {
    if (items.length) {
      window.localStorage.setItem(CART_KEY, JSON.stringify(items));
    } else {
      window.localStorage.removeItem(CART_KEY);
    }
    setCart(items);
  };

  const handleRegister = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name || !email || !password) {
      setMessage("Please complete all registration fields.");
      return;
    }
    if (storedUser) {
      setMessage(
        "An account already exists. Please login or logout before registering a new account.",
      );
      return;
    }

    const newUser: User = { name, email, password };
    saveStoredUser(newUser);
    setMode("login");
    setMessage("Account created. You can now login.");
    setName("");
    setEmail("");
    setPassword("");
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setMessage("Please enter email and password.");
      return;
    }
    if (!storedUser) {
      setMessage("No account found. Please register first.");
      return;
    }
    if (storedUser.email !== email || storedUser.password !== password) {
      setMessage("Email or password is incorrect.");
      return;
    }

    setAccount(storedUser);
    saveSession(true);
    setMessage(`Welcome back, ${storedUser.name}!`);
    setPassword("");
  };

  const handleLogout = () => {
    setAccount(null);
    saveSession(false);
    setMessage("You are logged out.");
  };

  const handleAddToCart = (productId: string) => {
    setOrderMessage("");
    const existing = cart.find((item) => item.productId === productId);
    const nextCart = existing
      ? cart.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      : [...cart, { productId, quantity: 1 }];
    saveCart(nextCart);
    setMessage("Added item to cart.");
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const nextCart = cart
      .map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      )
      .filter((item) => item.quantity > 0);
    saveCart(nextCart);
  };

  const handleRemoveFromCart = (productId: string) => {
    const nextCart = cart.filter((item) => item.productId !== productId);
    saveCart(nextCart);
  };

  const handleCheckout = () => {
    if (!cart.length) {
      setOrderMessage("Your cart is empty.");
      return;
    }
    if (!account) {
      setOrderMessage("Create an account before checkout.");
      return;
    }

    saveCart([]);
    setOrderMessage(
      `Thank you for your purchase, ${account.name}! Your order total is ${formatPrice(
        subtotal,
      )}.`,
    );
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
                : storedUser
                ? `Registered user found: ${storedUser.email}. Please login.`
                : "No account yet. Register to continue."}
            </p>
            {account ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700"
              >
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
                  }`}
                >
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
                  }`}
                >
                  Register
                </button>
              </div>

              <div>
                <h2 className="mb-4 text-2xl font-semibold">
                  {mode === "login" ? "Login to your account" : "Create your account"}
                </h2>
                <form
                  className="space-y-4"
                  onSubmit={mode === "login" ? handleLogin : handleRegister}
                >
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
                    className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    {mode === "login" ? "Login" : "Register"}
                  </button>
                </form>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="mb-4 text-2xl font-semibold">Why create an account?</h2>
                <p className="text-sm leading-6 text-slate-600">
                  Register once and keep your cart across refreshes. After login,
                  you can browse goods, add items to the cart, and checkout.
                </p>

                {storedUser ? (
                  <div className="mt-6 rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                    <p className="font-semibold">Registered user found</p>
                    <p>Email: {storedUser.email}</p>
                    <p className="mt-2 text-slate-500">
                      If this is your account, login now.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                    <p>No account exists yet.</p>
                    <p className="mt-2 text-slate-500">
                      Use the register tab to create your user account.
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </section>
        ) : (
          <section className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-8">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="mb-4 text-2xl font-semibold">Available Goods</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {PRODUCTS.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      <p className="mt-2 text-sm text-slate-600">{product.description}</p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-lg font-semibold text-slate-900">
                          {formatPrice(product.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product.id)}
                          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Shopping Cart</h2>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
                    {cartItems.length}
                  </span>
                </div>

                {cartItems.length === 0 ? (
                  <p className="text-sm text-slate-600">Your cart is empty.</p>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.productId} className="rounded-3xl bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {item.product?.name}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {formatPrice(item.product?.price || 0)} each
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.productId)}
                            className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.productId,
                                  Math.max(1, item.quantity - 1),
                                )
                              }
                              className="h-10 w-10 rounded-full bg-slate-100 text-slate-700"
                            >
                              −
                            </button>
                            <span className="min-w-8 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                              className="h-10 w-10 rounded-full bg-slate-100 text-slate-700"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-slate-900">
                            {formatPrice((item.product?.price || 0) * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 rounded-3xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="mt-4 w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Checkout
                  </button>
                </div>

                {orderMessage ? (
                  <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                    {orderMessage}
                  </div>
                ) : null}
              </div>
            </aside>
          </section>
        )}
      </div>
    </div>
  );
}
