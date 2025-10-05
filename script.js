// ---------------- Supabase setup ---------------- 
const SUPABASE_URL = "https://avlwpnovjkxrogrfjeuj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHdwbm92amt4cm9ncmZqZXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDI2ODgsImV4cCI6MjA3NDU3ODY4OH0.cmDyPatRmI0EU6EkXygCmtFtXKXHhvk7ie60479Djew";

// ✅ create client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ---------------- Admin Panel ----------------
const adminBtn = document.getElementById("adminBtn");
const formSection = document.querySelector(".form-section");
const closeAdminBtn = document.getElementById("closeAdminBtn");
const ADMIN_PASSWORD = "three_roses111721";

if (adminBtn) {
  adminBtn.addEventListener("click", () => {
    const password = prompt("Enter Admin Password:");
    if (password === ADMIN_PASSWORD) {
      if (formSection) formSection.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      alert("Incorrect password!");
    }
  });
}

if (closeAdminBtn && formSection) {
  closeAdminBtn.addEventListener("click", () => {
    formSection.style.display = "none";
  });
}

// ---------------- Product Management ----------------
const productForm = document.getElementById("productForm");
const productList = document.querySelector(".product-list");
const adminProductList = document.querySelector(".admin-product-list");
let cart = [];

// load cart from localStorage (safe restore of numbers)
function loadCartFromStorage() {
  const saved = localStorage.getItem("cart");
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      cart = parsed.map(it => ({
        name: it.name,
        qty: Number(it.qty) || 1,
        price: Number(it.price) || 0
      }));
    }
  } catch (e) {
    cart = [];
  }
}
loadCartFromStorage();

// ---------------- Render Admin Products ----------------
async function renderAdminProducts() {
  const { data: products, error } = await supabase.from("products").select("*");
  if (error) return console.error(error);

  if (!adminProductList) return;
  adminProductList.innerHTML = "";
  products.forEach((product) => {
    const div = document.createElement("div");
    div.style.cssText =
      "border:1px solid #ccc;padding:10px;margin-bottom:10px;border-radius:5px;display:flex;justify-content:space-between;align-items:center;";

    div.innerHTML = `
      <div>
        <strong>${product.name}</strong> | Rs. ${parseFloat(product.price).toFixed(2)} | ${product.category} <br>
        ${product.description || ""}
      </div>
      <div>
        <button class="edit-btn" data-id="${product.id}" style="margin-right:5px;">Edit</button>
        <button class="delete-btn" data-id="${product.id}">Delete</button>
      </div>
    `;
    adminProductList.appendChild(div);
  });

  // Edit product
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const productId = btn.dataset.id;
      const { data: product } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (!product) return alert("Product not found");

      document.getElementById("productName").value = product.name || "";
      document.getElementById("productPrice").value = product.price || "";
      document.getElementById("productCategory").value = product.category || "";
      document.getElementById("productDescription").value = product.description || "";
      document.getElementById("inStock").checked = !!product.in_stock;
      document.getElementById("featured").checked = !!product.featured;

      if (productForm) {
        productForm.onsubmit = async (e) => {
          e.preventDefault();
          const updated = {
            name: document.getElementById("productName").value,
            price: parseFloat(document.getElementById("productPrice").value) || 0,
            category: document.getElementById("productCategory").value,
            description: document.getElementById("productDescription").value,
            in_stock: document.getElementById("inStock").checked,
            featured: document.getElementById("featured").checked,
          };

          const { error } = await supabase
            .from("products")
            .update(updated)
            .eq("id", productId);

          if (error) alert("Error updating product");
          else {
            alert("Product updated successfully");
            productForm.reset();
            productForm.onsubmit = addProductHandler;
            await renderAdminProducts();
            await renderProductSection();
          }
        };
      }
    });
  });

  // Delete product
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to delete this product?")) {
        const { error } = await supabase
          .from("products")
          .delete()
          .eq("id", btn.dataset.id);
        if (error) alert("Error deleting product");
        else renderAdminProducts();
      }
    });
  });
}
renderAdminProducts();

// ---------------- Add Product ----------------
async function addProductHandler(e) {
  if (e && e.preventDefault) e.preventDefault();

  const name = document.getElementById("productName").value;
  const price = parseFloat(document.getElementById("productPrice").value) || 0;
  const category = document.getElementById("productCategory").value;
  const description = document.getElementById("productDescription").value;
  const inStock = document.getElementById("inStock").checked;
  const featured = document.getElementById("featured").checked;
  const imageFileEl = document.getElementById("productImage");
  const imageFile = imageFileEl && imageFileEl.files ? imageFileEl.files[0] : null;

  let imageUrl = "";
  if (imageFile) {
    const filePath = `public/${Date.now()}_${imageFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, imageFile, { upsert: true });

    if (uploadError) {
      alert("Error uploading image: " + uploadError.message);
      return;
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);
    imageUrl = data.publicUrl;
  }

  const { error } = await supabase.from("products").insert([
    { name, price, category, description, in_stock: inStock, featured, image_url: imageUrl },
  ]);

  if (error) alert("Error adding product: " + error.message);
  else {
    alert("Product added successfully");
    if (productForm) productForm.reset();
    renderAdminProducts();
    renderProductSection();
  }
}
if (productForm) productForm.onsubmit = addProductHandler;


// ---------------- Category Filter (cards) ----------------
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", () => {
      const categoryName = card.dataset.category || (card.querySelector("h3") ? card.querySelector("h3").textContent.trim() : null);
      renderProductSection(categoryName);

      // scroll to the product list area (use your container id/class)
      const productSection = document.getElementById("product-list") || document.querySelector(".product-section") || productList;
      if (productSection) productSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  const showAllBtn = document.getElementById("showAllBtn");
  if (showAllBtn) {
    showAllBtn.addEventListener("click", () => {
      renderProductSection();
      const productSection = document.getElementById("product-list") || document.querySelector(".product-section") || productList;
      if (productSection) productSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
});


// ---------------- Render Products (with category filter) ----------------
async function renderProductSection(category = null) {
  let query = supabase.from("products").select("*").order("id", { ascending: true });
  if (category && category !== "all") {
    // case-insensitive exact match
    query = query.ilike("category", category);
  }

  const { data: products, error } = await query;
  if (error) {
    console.error("Error fetching products:", error.message);
    return;
  }

  if (!productList) return;
  productList.innerHTML = "";

  if (!products || products.length === 0) {
    productList.innerHTML = `<p style="text-align:center;color:#666;padding:20px;">No products found.</p>`;
    return;
  }

  products.forEach((product) => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    const bgColor = product.in_stock ? "#f1fff4" : "#ffecec";
    const priceValue = Number(product.price) || 0;

    // set data-price attribute (numeric) to avoid parsing text later
    card.innerHTML = `
      <img src="${product.image_url || "placeholder.png"}" alt="${product.name}" class="product-image" style="width:160px;height:160px;object-fit:cover;border-radius:10px;">
      <h3 class="product-name">${product.name}</h3>
      <p class="product-category">Category: <span>${product.category}</span></p>
      <p class="product-price" data-price="${priceValue}">Rs. ${priceValue.toFixed(2)}</p>
      <p class="product-desc">${product.description || ""}</p>
      <p class="product-stock" style="color:${product.in_stock ? "green" : "red"};font-weight:700;">
        ${product.in_stock ? "In Stock" : "Out of Stock"}
      </p>
      <div class="qty-wrapper" style="margin-top:8px;display:flex;gap:8px;align-items:center;justify-content:center;">
        <button type="button" class="qty-btn minus" ${!product.in_stock ? "disabled" : ""}>−</button>
        <input type="number" class="product-qty" min="1" value="1" ${!product.in_stock ? "disabled" : ""} style="width:60px;text-align:center;padding:6px;border-radius:6px;border:1px solid #ddd;">
        <button type="button" class="qty-btn plus" ${!product.in_stock ? "disabled" : ""}>+</button>
      </div>
      <div class="btn-group" style="display:flex;gap:10px;margin-top:10px;justify-content:center;">
        <button class="add-to-cart-btn" ${!product.in_stock ? "disabled" : ""} style="background:#27ae60;color:#fff;padding:8px 12px;border-radius:8px;border:none;cursor:pointer;">Add to Cart</button>
        <button class="order-now-btn" ${!product.in_stock ? "disabled" : ""} style="background:#e74c3c;color:#fff;padding:8px 12px;border-radius:8px;border:none;cursor:pointer;">Buy Now</button>
      </div>
    `;
    card.style.background = bgColor;
    card.querySelector(".product-price").setAttribute("data-price", String(priceValue)); // ensure it's set
    productList.appendChild(card);
  });
}
renderProductSection();


// ---------------- Cart ----------------
const cartSection = document.getElementById("cartSection");
const cartItemsContainer = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartIcon = document.querySelector(".cart");

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function renderCart() {
  if (!cartItemsContainer || !cartTotalEl) return;
  cartItemsContainer.innerHTML = "";
  let total = 0;
  cart.forEach((item, index) => {
    const itemPrice = Number(item.price) || 0;
    const itemQty = Number(item.qty) || 1;
    const subTotal = itemPrice * itemQty;
    total += subTotal;

    const div = document.createElement("div");
    div.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;";
    div.innerHTML = `
      <span>${itemQty}x ${item.name} — Rs. ${itemPrice.toFixed(2)} each (Rs. ${subTotal.toFixed(2)})</span>
      <button data-index="${index}" style="background:#dc3545;color:#fff;border:none;border-radius:5px;padding:6px 8px;cursor:pointer;">Remove</button>
    `;
    cartItemsContainer.appendChild(div);
  });

  cartTotalEl.textContent = `Total: Rs. ${total.toFixed(2)}`;

  // cart-count = total items (sum of qty)
  const cartCountEl = document.querySelector(".cart-count");
  if (cartCountEl) cartCountEl.textContent = cart.reduce((s, it) => s + (Number(it.qty) || 1), 0);

  saveCart();
}

// smarter addToCart: merge same product+price
function addToCart(product) {
  // product: { name, price (unit), qty }
  const priceNum = Number(product.price) || 0;
  const qtyNum = Number(product.qty) || 1;

  const idx = cart.findIndex(c => c.name === product.name && Number(c.price) === priceNum);
  if (idx > -1) {
    cart[idx].qty = (Number(cart[idx].qty) || 0) + qtyNum;
  } else {
    cart.push({ name: product.name, price: priceNum, qty: qtyNum });
  }
  renderCart();
}

// remove item
if (cartItemsContainer) {
  cartItemsContainer.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      const idx = Number(e.target.dataset.index);
      if (!Number.isNaN(idx)) {
        cart.splice(idx, 1);
        renderCart();
      }
    }
  });
}

if (cartIcon) {
  if (!document.querySelector(".cart-count")) {
    const span = document.createElement("span");
    span.className = "cart-count";
    span.textContent = cart.reduce((s, it) => s + (Number(it.qty) || 1), 0);
    cartIcon.appendChild(span);
  }
  cartIcon.addEventListener("click", () => {
    if (cartSection) {
      cartSection.style.display = "block";
      cartSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

if (closeCartBtn) {
  closeCartBtn.addEventListener("click", () => {
    if (cartSection) cartSection.style.display = "none";
  });
}

// ensure cart restored UI on load
window.addEventListener("load", () => {
  loadCartFromStorage();
  renderCart();
});

// ---------------- Checkout + WhatsApp ----------------
const WHATSAPP_NUMBER = "94788878668";

function openCheckoutForm(cartItems, total) {
  const formOverlay = document.createElement("div");
  formOverlay.classList.add("checkout-overlay");
  formOverlay.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;";

  formOverlay.innerHTML = `
    <div class="checkout-form" style="background:#fff;padding:18px;border-radius:10px;max-width:340px;width:100%;">
      <h2 style="margin-top:0;text-align:center;">🛍️ Checkout</h2>

      <label style="display:block;margin-top:8px;">Name*</label>
      <input type="text" id="custName" required style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;">

      <label style="display:block;margin-top:8px;">Address*</label>
      <textarea id="custAddress" required style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;"></textarea>

      <label style="display:block;margin-top:8px;">Contact Number*</label>
      <input type="tel" id="custPhone" required style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;">

      <label style="display:block;margin-top:8px;">Email*</label>
      <input type="email" id="custEmail" required style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;">

      <label style="display:block;margin-top:8px;">Payment Method*</label>
      <div class="payment-options" style="margin-top:8px;">
        <label style="display:flex;justify-content:space-between;"><span>Cash on Delivery</span><input type="radio" name="payment" value="Cash on Delivery" checked></label>
        <label style="display:flex;justify-content:space-between;"><span>Bank Transfer</span><input type="radio" name="payment" value="Bank Transfer"></label>
      </div>

      <div style="margin-top:12px;">
        <strong>Order Summary:</strong>
        <pre id="checkoutSummary" style="white-space:pre-wrap;background:#fafafa;padding:8px;border-radius:6px;border:1px solid #eee;max-height:180px;overflow:auto;"></pre>
      </div>

      <div style="display:flex;gap:10px;justify-content:space-between;margin-top:12px;">
        <button id="confirmOrderBtn" style="flex:1;padding:10px 0;border-radius:8px;border:none;background:#27ae60;color:#fff;font-weight:600;cursor:pointer;">Confirm</button>
        <button id="cancelOrderBtn" style="flex:1;padding:10px 0;border-radius:8px;border:none;background:#bdc3c7;color:#fff;font-weight:600;cursor:pointer;">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(formOverlay);

  // fill summary
  const summaryEl = formOverlay.querySelector("#checkoutSummary");
  let summaryText = "";
  cartItems.forEach((it, i) => {
    const unit = Number(it.price) || 0;
    const q = Number(it.qty) || 1;
    const sub = unit * q;
    summaryText += `${i + 1}. ${it.name} — ${q} × Rs.${unit.toFixed(2)} = Rs.${sub.toFixed(2)}\n`;
  });
  summaryText += `\n💰 Total: Rs.${Number(total).toFixed(2)}`;
  summaryEl.textContent = summaryText;

  // cancel button
  document.getElementById("cancelOrderBtn").onclick = () => formOverlay.remove();

  // confirm order button
  document.getElementById("confirmOrderBtn").onclick = () => {
    const name = document.getElementById("custName").value.trim();
    const address = document.getElementById("custAddress").value.trim();
    const phone = document.getElementById("custPhone").value.trim();
    const email = document.getElementById("custEmail").value.trim();
    const payment = document.querySelector("input[name='payment']:checked").value;

    if (!name || !address || !phone || !email) {
      alert("Please fill in all fields.");
      return;
    }

    // WhatsApp Message Format
    let message = `🛒 *AYSHLYNE Stationery Order Confirmation*\n\n`;
    message += `👤 *Customer Details:*\n`;
    message += `• Name: ${name}\n`;
    message += `• Address: ${address}\n`;
    message += `• Phone: ${phone}\n`;
    message += `• Email: ${email}\n`;
    message += `• Payment: ${payment}\n\n`;

    message += `📦 *Order Details:*\n`;
    cartItems.forEach((item, index) => {
      const unit = Number(item.price) || 0;
      const qty = Number(item.qty) || 1;
      const sub = unit * qty;
      message += `${index + 1}. ${item.name} — ${qty} × Rs.${unit.toFixed(2)} = Rs.${sub.toFixed(2)}\n`;
    });

    message += `\n💰 *Total:* Rs.${Number(total).toFixed(2)}\n\n✅ *THANKS FOR YOUR SERVICE*`;

    // Open WhatsApp
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");

    // Clear cart and close form
    cart = [];
    localStorage.removeItem("cart");
    renderCart();
    formOverlay.remove();
  };
}

// Checkout button
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    if (!Array.isArray(cart) || cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    const total = cart.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);
    openCheckoutForm([...cart], total);
  });
}

// ---------------- Product Buttons (delegated) ----------------
document.addEventListener("click", (e) => {
  // qty plus/minus buttons
  if (e.target.matches(".qty-btn.plus")) {
    const card = e.target.closest(".product-card");
    if (!card) return;
    const input = card.querySelector(".product-qty");
    if (!input) return;
    input.value = Math.max(1, (Number(input.value) || 1) + 1);
    return;
  }
  if (e.target.matches(".qty-btn.minus")) {
    const card = e.target.closest(".product-card");
    if (!card) return;
    const input = card.querySelector(".product-qty");
    if (!input) return;
    input.value = Math.max(1, (Number(input.value) || 1) - 1);
    return;
  }

  // Add to Cart
  if (e.target.classList && e.target.classList.contains("add-to-cart-btn")) {
    const card = e.target.closest(".product-card");
    if (!card) return;
    const qty = Number(card.querySelector(".product-qty").value) || 1;
    const pricePerItem = Number(card.querySelector(".product-price").dataset.price) || 0;
    const name = card.querySelector(".product-name") ? card.querySelector(".product-name").textContent : "Product";
    addToCart({ name, price: pricePerItem, qty });
    return;
  }

  // Buy Now / Order Now
  if (e.target.classList && e.target.classList.contains("order-now-btn")) {
    const card = e.target.closest(".product-card");
    if (!card) return;
    const qty = Number(card.querySelector(".product-qty").value) || 1;
    const pricePerItem = Number(card.querySelector(".product-price").dataset.price) || 0;
    const name = card.querySelector(".product-name") ? card.querySelector(".product-name").textContent : "Product";
    const totalPrice = pricePerItem * qty;
    openCheckoutForm([{ name, price: pricePerItem, qty }], totalPrice);
    return;
  }
});
