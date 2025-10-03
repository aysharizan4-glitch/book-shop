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

  // ---------------- Edit product ----------------
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

  // ---------------- Delete product ----------------
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


// ---------------- Render Products ----------------
async function renderProductSection() {
  const { data: products } = await supabase.from("products").select("*");

  if (!productList) return;
  productList.innerHTML = "";
  products.forEach((product) => {
    const card = document.createElement("div");
    card.classList.add("product-card");
    // prefer styling in CSS—keep minimal inline fallback for background
    const bgColor = product.in_stock ? "hsla(124, 100%, 97%, 1.00)" : "#f6e9e9ff";
    card.style.cssText =
      `border:1.5px solid #0b0b0bff;padding:10px;border-radius:12px;background:${bgColor};width:240px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;box-shadow:0 2px 5px rgba(15, 14, 14, 1);`;

    const priceValue = parseFloat(product.price) || 0;

    card.innerHTML = `
      <img src="${product.image_url || "placeholder.png"}" alt="${product.name}" class="product-image" style="width:160px;height:200px;object-fit:cover;border-radius:10px;">
      <h3 class="product-name" style="margin:6px 0">${product.name}</h3>
      <p class="product-category" style="margin:0 0 6px 0">Category: <span>${product.category}</span></p>
      <p class="product-price" data-price="${priceValue}" style="margin:0;padding:6px 10px;border-radius:8px;display:inline-block;font-weight:700;">Rs. ${priceValue.toFixed(2)}</p>
      <p class="product-desc" style="margin:6px 0 0 0;font-size:0.95rem">${product.description || ""}</p>
      <p class="product-stock ${product.in_stock ? "in-stock" : "out-of-stock"}" style="margin:8px 0 0 0;font-weight:700;">
        ${product.in_stock ? "In Stock" : "Out of Stock"}
      </p>

      <div class="qty-wrapper" style="margin-top:10px;">
        <label style="margin-right:6px;">Qty:</label>
        <input type="number" class="product-qty" min="1" value="1" ${!product.in_stock ? "disabled" : ""} style="width:64px;padding:6px;border:1px solid #ddd;border-radius:6px;text-align:center;">
      </div>

      <div class="btn-group" style="display:flex;gap:10px;margin-top:10px;">
        <button class="add-to-cart-btn" ${!product.in_stock ? "disabled" : ""} style="padding:8px 12px;border-radius:8px;border:none;cursor:pointer;">Add to Cart</button>
        <button class="order-now-btn" ${!product.in_stock ? "disabled" : ""} style="padding:8px 12px;border-radius:8px;border:none;cursor:pointer;">Buy Now</button>
      </div>
    `;
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

if (cartIcon) {
  if (!document.querySelector(".cart-count")) {
    const span = document.createElement("span");
    span.className = "cart-count";
    span.textContent = "0";
    cartIcon.appendChild(span);
  }
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

window.addEventListener("load", () => {
  const saved = localStorage.getItem("cart");
  if (saved) {
    try {
      cart = JSON.parse(saved) || [];
    } catch (err) {
      cart = [];
    }
    renderCart();
  }
});

function renderCart() {
  if (!cartItemsContainer || !cartTotalEl) return;
  cartItemsContainer.innerHTML = "";
  let total = 0;
  cart.forEach((item, index) => {
    const itemPrice = parseFloat(item.price) || 0;
    const itemQty = parseInt(item.qty) || 1;
    const subTotal = itemPrice * itemQty;
    total += subTotal;
    const div = document.createElement("div");
    div.style.cssText =
      "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;";
    div.innerHTML = `
      <span>${item.name} x${itemQty} — Rs. ${itemPrice.toFixed(2)} each (Rs. ${subTotal.toFixed(2)})</span>
      <button data-index="${index}" style="background:#dc3545;color:#fff;border:none;border-radius:5px;padding:6px 8px;cursor:pointer;">Remove</button>
    `;
    cartItemsContainer.appendChild(div);
  });

  cartTotalEl.textContent = `Total: Rs. ${total.toFixed(2)}`;
  const cartCountEl = document.querySelector(".cart-count");
  if (cartCountEl) cartCountEl.textContent = cart.reduce((s, it) => s + (parseInt(it.qty) || 1), 0);
  saveCart();
}

function addToCart(product) {
  // product: { name, price, qty }
  const existingIndex = cart.findIndex(
    (c) => c.name === product.name && parseFloat(c.price) === parseFloat(product.price)
  );
  if (existingIndex > -1) {
    // increase qty
    cart[existingIndex].qty = (parseInt(cart[existingIndex].qty) || 0) + (parseInt(product.qty) || 1);
  } else {
    cart.push({ name: product.name, price: parseFloat(product.price) || 0, qty: parseInt(product.qty) || 1 });
  }
  renderCart();
}

if (cartItemsContainer) {
  cartItemsContainer.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      const idx = e.target.dataset.index;
      cart.splice(idx, 1);
      renderCart();
    }
  });
}

if (cartIcon) {
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

// ---------------- Checkout + WhatsApp ----------------
const WHATSAPP_NUMBER = "94788878668";

function openCheckoutForm(cartItems, total) {
  const formOverlay = document.createElement("div");
  formOverlay.classList.add("checkout-overlay");
  formOverlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;";

  formOverlay.innerHTML = `
    <div class="checkout-form" style="background:#fff;padding:18px;border-radius:10px;max-width:480px;width:100%;box-shadow:0 6px 24px rgba(0,0,0,0.15);">
      <h2 style="margin-top:0">Confirmation</h2>
      <label style="display:block;margin-top:8px;">Name*</label>
      <input type="text" id="custName" required style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;">
      <label style="display:block;margin-top:8px;">Address*</label>
      <textarea id="custAddress" required style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;"></textarea>
      <label style="display:block;margin-top:8px;">Contact Number*</label>
      <input type="tel" id="custPhone" required style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;">
      <label style="display:block;margin-top:8px;">Email*</label>
      <input type="email" id="custEmail" required style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;">
      <label style="display:block;margin-top:8px;">Payment Method*</label>
      <div class="payment-options" style="margin-top:6px;">
        <label style="margin-right:10px;"><input type="radio" name="payment" value="Cash on Delivery" checked> Cash on Delivery</label>
        <label><input type="radio" name="payment" value="Bank Transfer"> Bank Transfer</label>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;">
        <button id="confirmOrderBtn" style="padding:8px 12px;border-radius:8px;border:none;background:#27ae60;color:#fff;cursor:pointer;">Confirm</button>
        <button id="cancelOrderBtn" class="cancel" style="padding:8px 12px;border-radius:8px;border:none;background:#bdc3c7;color:#fff;cursor:pointer;">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(formOverlay);

  document.getElementById("cancelOrderBtn").onclick = () => formOverlay.remove();

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

    let itemsText = "";
    cartItems.forEach(item => {
      itemsText += `${item.qty || 1}x ${item.name} - Rs.${parseFloat(item.price).toFixed(2)}\n`;
    });

    const message = `
🛒 New Order - AYSHLYNE Stationery

👤 Name: ${name}
📍 Address: ${address}
📞 Contact: ${phone}
✉️ Email: ${email}
💳 Payment: ${payment}

Products:
${itemsText}

💰 Total: Rs.${total.toFixed(2)}
    `;

    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");

    cart = [];
    renderCart();
    localStorage.removeItem("cart");
    formOverlay.remove();
  };
}

if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    const total = cart.reduce((s, it) => s + (parseFloat(it.price) || 0) * (parseInt(it.qty) || 1), 0);
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    // pass a shallow copy to avoid accidental mutation
    openCheckoutForm(JSON.parse(JSON.stringify(cart)), total);
  });
}

// ---------------- Product Buttons (Add to cart / Order now) ----------------
document.addEventListener("click", (e) => {
  // Add to Cart
  if (e.target.classList && e.target.classList.contains("add-to-cart-btn")) {
    const card = e.target.closest(".product-card");
    if (!card) return;
    const qtyInput = card.querySelector(".product-qty");
    const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;
    const priceEl = card.querySelector(".product-price");
    const price = priceEl ? parseFloat(priceEl.getAttribute("data-price")) || 0 : 0;
    const name = card.querySelector(".product-name") ? card.querySelector(".product-name").textContent : "Product";
    addToCart({ name, price, qty });
  }

  // Order Now — open checkout for single product
  if (e.target.classList && e.target.classList.contains("order-now-btn")) {
    const card = e.target.closest(".product-card");
    if (!card) return;
    const qtyInput = card.querySelector(".product-qty");
    const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;
    const priceEl = card.querySelector(".product-price");
    const price = priceEl ? parseFloat(priceEl.getAttribute("data-price")) || 0 : 0;
    const name = card.querySelector(".product-name") ? card.querySelector(".product-name").textContent : "Product";
    const product = { name, price, qty };
    openCheckoutForm([product], (price * qty));
  }
});
