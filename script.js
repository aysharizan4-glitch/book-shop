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


// ---------------- Category Filter ----------------
document.querySelectorAll(".category-card").forEach((card) => {
  card.addEventListener("click", () => {
    const categoryName = card.querySelector("h3").textContent.trim();
    renderProductSection(categoryName);

    // ✅ Scroll to products section automatically
    const productSection = document.getElementById("product-list");
    if (productSection) {
      productSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// ---------------- Show All Button ----------------
const showAllBtn = document.getElementById("showAllBtn");
if (showAllBtn) {
  showAllBtn.addEventListener("click", () => {
    renderProductSection();

    // ✅ Scroll to products section automatically
    const productSection = document.getElementById("product-list");
    if (productSection) {
      productSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

// ---------------- Render Products (with category filter) ----------------
async function renderProductSection(category = null) {
  let query = supabase.from("products").select("*");
  if (category) query = query.eq("category", category);

  const { data: products, error } = await query;
  if (error) {
    console.error("Error fetching products:", error.message);
    return;
  }

  if (!productList) return;
  productList.innerHTML = "";

  products.forEach((product) => {
    const card = document.createElement("div");
    card.classList.add("product-card");

    const bgColor = product.in_stock ? "#f1fff4" : "#ffecec";
    const priceValue = parseFloat(product.price) || 0;

    card.innerHTML = `
      <img src="${product.image_url || "placeholder.png"}" alt="${product.name}" class="product-image">
      <h3 class="product-name">${product.name}</h3>
      <p class="product-category">Category: <span>${product.category}</span></p>
      <p class="product-price" data-price="${priceValue}">Rs. ${priceValue.toFixed(2)}</p>
      <p class="product-desc">${product.description || ""}</p>
      <p class="product-stock" style="color:${product.in_stock ? "green" : "red"};">
        ${product.in_stock ? "In Stock" : "Out of Stock"}
      </p>
      <div class="qty-wrapper">
        <label>Qty:</label>
        <input type="number" class="product-qty" min="1" value="1" ${!product.in_stock ? "disabled" : ""}>
      </div>
      <div class="btn-group">
        <button class="add-to-cart-btn" ${!product.in_stock ? "disabled" : ""}>Add to Cart</button>
        <button class="order-now-btn" ${!product.in_stock ? "disabled" : ""}>Order Now</button>
      </div>
    `;

    card.style.background = bgColor;
    productList.appendChild(card);
  });
}

// Initial render
renderProductSection();

// ---------------- Cart ----------------
const cartSection = document.getElementById("cartSection");
const cartItemsContainer = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartIcon = document.querySelector(".cart");

if (!document.querySelector(".cart-count")) {
  const span = document.createElement("span");
  span.className = "cart-count";
  span.textContent = "0";
  cartIcon.appendChild(span);
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

window.addEventListener("load", () => {
  const saved = localStorage.getItem("cart");
  if (saved) {
    cart = JSON.parse(saved);
    renderCart();
  }
});

function renderCart() {
  cartItemsContainer.innerHTML = "";
  let total = 0;
  cart.forEach((item, index) => {
    total += parseFloat(item.price);
    const div = document.createElement("div");
    div.style.cssText =
      "display:flex;justify-content:space-between;margin-bottom:5px;";
    div.innerHTML = `
      <span>${item.name} (Rs. ${parseFloat(item.price).toFixed(2)})</span>
      <button data-index="${index}" style="background:#dc3545;color:#fff;border:none;border-radius:5px;padding:2px 6px;cursor:pointer;">Remove</button>
    `;
    cartItemsContainer.appendChild(div);
  });

  cartTotalEl.textContent = `Total: Rs. ${total.toFixed(2)}`;
  document.querySelector(".cart-count").textContent = cart.length;
  saveCart();
}

function addToCart(product) {
  cart.push(product);
  renderCart();
}

cartItemsContainer.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    const idx = e.target.dataset.index;
    cart.splice(idx, 1);
    renderCart();
  }
});

cartIcon.addEventListener("click", () => {
  cartSection.style.display = "block";
  cartSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

closeCartBtn.addEventListener("click", () => (cartSection.style.display = "none"));


// ---------------- Checkout + WhatsApp ----------------
const WHATSAPP_NUMBER = "94788878668";

function openCheckoutForm(cartItems, total) {
  const formOverlay = document.createElement("div");
  formOverlay.classList.add("checkout-overlay");

  formOverlay.innerHTML = `
    <div class="checkout-form">
      <h2>Confirmation</h2>
      <label>Name*</label>
      <input type="text" id="custName" required>
      <label>Address*</label>
      <textarea id="custAddress" required></textarea>
      <label>Contact Number*</label>
      <input type="tel" id="custPhone" required>
      <label>Email*</label>
      <input type="email" id="custEmail" required>
      <label>Payment Method*</label>
     <div class="payment-options" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
  <label style="display: flex; justify-content: space-between; align-items: center;">
    <span>Cash on Delivery</span>
    <input type="radio" name="payment" value="Cash on Delivery" checked>
  </label>

  <label style="display: flex; justify-content: space-between; align-items: center;">
    <span>Bank Transfer</span>
    <input type="radio" name="payment" value="Bank Transfer">
  </label>
</div> 
      <button id="confirmOrderBtn">Confirm</button>
      <button id="cancelOrderBtn" class="cancel">Cancel</button>
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

checkoutBtn.addEventListener("click", () => {
  const cartItems = [];
  document.querySelectorAll("#cartItems div").forEach(itemEl => {
    const text = itemEl.querySelector("span").textContent;
    const name = text.split(" (")[0];
    const price = parseFloat(text.replace(/[^\d.]/g, "")) || 0;
    cartItems.push({ name, qty: 1, price });
  });

  const totalText = document.getElementById("cartTotal").textContent.replace(/[^\d.]/g, "");
  const total = parseFloat(totalText) || 0;

  if (cartItems.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  openCheckoutForm(cartItems, total);
});

// ---------------- Product Buttons ----------------
document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-to-cart-btn")) {
      const card = e.target.closest(".product-card");
      const product = {
        name: card.querySelector("h3").textContent,
        price: parseFloat(card.querySelector(".product-price").textContent.replace("Price:", "").replace("Rs.", "").trim()) || 0,
      };
      addToCart(product);
    }

    if (e.target.classList.contains("order-now-btn")) {
      const card = e.target.closest(".product-card");
      const product = {
        name: card.querySelector("h3").textContent,
        price: parseFloat(card.querySelector(".product-price").textContent.replace("Price:", "").replace("Rs.", "").trim()) || 0,
      };
      openCheckoutForm([product], product.price);
    }
  });
});