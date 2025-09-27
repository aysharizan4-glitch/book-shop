// ================= Supabase Setup =================
const SUPABASE_URL = "https://mjkixzefsmdusxtutoif.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qa2l4emVmc21kdXN4dHV0b2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTk2NzksImV4cCI6MjA3NDQ5NTY3OX0.kaMS_NQ7p9xnCV252aghbXk4esazxxTyuGTLBePTHTo"; // 🔑 replace with your actual key

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ================= Global Variables =================
let products = [];
let cart = [];

// ================= DOM Elements =================
const productFormEl = document.getElementById("productForm");
const adminProductListEl = document.querySelector(".admin-product-list");
const productListEl = document.querySelector(".product-list");
const cartIcon = document.querySelector(".cart");

const cartSection = document.getElementById("cartSection");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const closeCartBtn = document.getElementById("closeCartBtn");

// ================= Admin Panel Toggle =================
document.addEventListener("DOMContentLoaded", () => {
  const adminBtn = document.getElementById("adminBtn");
  const adminPanel = document.querySelector(".form-section");
  const closeAdminBtn = document.getElementById("closeAdminBtn");

  if (adminBtn && adminPanel && closeAdminBtn) {
    adminBtn.addEventListener("click", () => {
      const password = prompt("Enter Admin Password:");
      if (password === "admin123") {
        adminPanel.style.display = "block";
        adminPanel.scrollIntoView({ behavior: "smooth" });
      } else {
        alert("❌ Incorrect password!");
      }
    });

    closeAdminBtn.addEventListener("click", () => {
      adminPanel.style.display = "none";
    });
  }

  loadProductsFromSupabase();
});

// ================= Load Products =================
async function loadProductsFromSupabase() {
  try {
    const { data, error } = await db
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    products = data || [];
    renderProducts();
  } catch (err) {
    console.error("Failed to fetch products:", err.message);
  }
}

// ================= Add Product =================
productFormEl?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("productName").value.trim();
  const price = document.getElementById("productPrice").value.trim();
  const category = document.getElementById("productCategory").value.trim();
  const description = document.getElementById("productDescription").value.trim();
  const inStock = document.getElementById("inStock").checked;
  const featured = document.getElementById("featured").checked;
  const imageFile = document.getElementById("productImage").files[0];

  let imageUrl = "https://via.placeholder.com/150?text=No+Image";

  if (imageFile) {
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error: uploadError } = await db.storage
      .from("products")
      .upload(fileName, imageFile);

    if (!uploadError) {
      const { data } = db.storage.from("products").getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }
  }

  const { error } = await db.from("products").insert([
    { name, price, category, description, inStock, featured, image: imageUrl },
  ]);

  if (!error) {
    alert("✅ Product added successfully!");
    productFormEl.reset();
    loadProductsFromSupabase();
  } else {
    console.error("Insert failed:", error.message);
  }
});

// ================= Render Products =================
function renderProducts() {
  if (!productListEl || !adminProductListEl) return;

  // Admin product list
  adminProductListEl.innerHTML = "";
  products.forEach((product, index) => {
    adminProductListEl.innerHTML += `
      <div class="feature">
        <h4>${product.name}</h4>
        <img src="${product.image}" width="80">
        <p>Price: LKR ${parseFloat(product.price).toFixed(2)}</p>
        <p>Category: ${product.category}</p>
        <button class="edit-btn" data-index="${index}">Edit</button>
        <button class="delete-btn" data-index="${index}">Delete</button>
      </div>`;
  });

  // Customer product list
  productListEl.innerHTML = "";
  products.forEach((product, index) => {
    productListEl.innerHTML += `
      <div class="feature">
        <h4>${product.name}</h4>
        <img src="${product.image}" width="150">
        <p>LKR ${parseFloat(product.price).toFixed(2)}</p>
        <p>${product.category}</p>
        <p>${product.description}</p>
        <p>Stock: <span style="color:#fff;padding:2px 6px;border-radius:5px;background:${
          product.inStock ? "#28a745" : "#dc3545"
        }">${product.inStock ? "In Stock" : "Out of Stock"}</span></p>
        <button class="cart-btn" data-index="${index}">Add to Cart</button>
        <button class="order-btn" data-index="${index}">Order Now</button>
      </div>`;
  });
}

// ================= Admin Edit/Delete =================
adminProductListEl?.addEventListener("click", (e) => {
  const index = e.target.dataset.index;
  if (e.target.classList.contains("delete-btn")) {
    products.splice(index, 1);
    renderProducts();
  }
  if (e.target.classList.contains("edit-btn")) {
    const product = products[index];
    document.getElementById("productName").value = product.name;
    document.getElementById("productPrice").value = product.price;
    document.getElementById("productCategory").value = product.category;
    document.getElementById("productDescription").value = product.description;
    document.getElementById("inStock").checked = product.inStock;
    document.getElementById("featured").checked = product.featured;
    products.splice(index, 1);
    renderProducts();
  }
});

// ================= Cart System =================
function updateCartCount() {
  if (cartIcon) cartIcon.textContent = "🛒 " + cart.length;
}

function renderCart() {
  cartItemsEl.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = "<p>Your cart is empty.</p>";
  } else {
    cart.forEach((item, i) => {
      total += parseFloat(item.price);
      cartItemsEl.innerHTML += `
        <div style="display:flex;justify-content:space-between;margin:5px 0;">
          <span>${item.name} - LKR ${parseFloat(item.price).toFixed(2)}</span>
          <button data-index="${i}" class="removeCartBtn">Remove</button>
        </div>`;
    });
  }

  cartTotalEl.textContent = "Total: LKR " + total.toFixed(2);

  document.querySelectorAll(".removeCartBtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      cart.splice(e.target.dataset.index, 1);
      updateCartCount();
      renderCart();
    });
  });
}

// Cart open/close
cartIcon?.addEventListener("click", () => {
  renderCart();
  cartSection.style.display = "block";
  cartSection.scrollIntoView({ behavior: "smooth" });
});
closeCartBtn?.addEventListener("click", () => {
  cartSection.style.display = "none";
});

// ================= Checkout =================
checkoutBtn?.addEventListener("click", () => {
  if (cart.length === 0) return alert("Your cart is empty!");

  let message = "Hello AYSHLYNE,%0A%0AI want to checkout:%0A";
  let total = 0;
  cart.forEach((item) => {
    message += `- ${item.name} | LKR ${parseFloat(item.price).toFixed(2)}%0A`;
    total += parseFloat(item.price);
  });
  message += `%0ATotal: LKR ${total.toFixed(2)}%0A%0AThanks!`;

  window.open(`https://wa.me/94788878600?text=${message}`, "_blank");
});

// ================= Add to Cart & Order =================
productListEl?.addEventListener("click", (e) => {
  const index = e.target.dataset.index;
  if (e.target.classList.contains("cart-btn")) {
    cart.push(products[index]);
    updateCartCount();
    alert(`✅ "${products[index].name}" added to cart!`);
  }
  if (e.target.classList.contains("order-btn")) {
    const product = products[index];
    const message = `Hello AYSHLYNE,%0A%0AI want to order:%0A- ${
      product.name
    }%0A- Price: LKR ${parseFloat(product.price).toFixed(
      2
    )}%0A- Category: ${product.category}%0A- ${
      product.inStock ? "In Stock" : "Out of Stock"
    }%0A%0AThanks!`;
    window.open(`https://wa.me/94788878600?text=${message}`, "_blank");
  }
});
