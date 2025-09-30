// ---------------- Supabase setup ---------------- 
const SUPABASE_URL = "https://avlwpnovjkxrogrfjeuj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHdwbm92amt4cm9ncmZqZXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDI2ODgsImV4cCI6MjA3NDU3ODY4OH0.cmDyPatRmI0EU6EkXygCmtFtXKXHhvk7ie60479Djew";

// ✅ create client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ---------------- Admin Panel ----------------
const adminBtn = document.getElementById("adminBtn");
const formSection = document.querySelector(".form-section");
const closeAdminBtn = document.getElementById("closeAdminBtn");
const ADMIN_PASSWORD = "1234"; // Change this

adminBtn.addEventListener("click", () => {
  const password = prompt("Enter Admin Password:");
  if (password === ADMIN_PASSWORD) {
    formSection.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    alert("Incorrect password!");
  }
});

closeAdminBtn.addEventListener("click", () => {
  formSection.style.display = "none";
});

// ---------------- Product Management ----------------
const productForm = document.getElementById("productForm");
const productList = document.querySelector(".product-list");
const adminProductList = document.querySelector(".admin-product-list");
let cart = [];

// Render products in Admin Panel
async function renderAdminProducts() {
  const { data: products, error } = await supabase.from("products").select("*");
  if (error) return console.error(error);

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

      document.getElementById("productName").value = product.name;
      document.getElementById("productPrice").value = product.price;
      document.getElementById("productCategory").value = product.category;
      document.getElementById("productDescription").value = product.description;
      document.getElementById("inStock").checked = product.inStock;
      document.getElementById("featured").checked = product.featured;

      productForm.onsubmit = async (e) => {
        e.preventDefault();
        const updated = {
          name: document.getElementById("productName").value,
          price: document.getElementById("productPrice").value,
          category: document.getElementById("productCategory").value,
          description: document.getElementById("productDescription").value,
          inStock: document.getElementById("inStock").checked,
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
          renderAdminProducts();
          renderProductSection();
        }
      };
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
  e.preventDefault();
  const name = document.getElementById("productName").value;
  const price = document.getElementById("productPrice").value;
  const category = document.getElementById("productCategory").value;
  const description = document.getElementById("productDescription").value;
  const inStock = document.getElementById("inStock").checked;
  const featured = document.getElementById("featured").checked;
  const imageFile = document.getElementById("productImage").files[0];

  let imageUrl = "";
  if (imageFile) {
    const { error } = await supabase.storage
      .from("product-images")
      .upload(`public/${imageFile.name}`, imageFile, { upsert: true });
    if (!error) {
      imageUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/public/${imageFile.name}`;
    }
  }

  const { error } = await supabase.from("products").insert([
    { name, price, category, description, inStock, featured, imageUrl },
  ]);

  if (error) alert("Error adding product");
  else {
    alert("Product added successfully");
    productForm.reset();
    renderAdminProducts();
    renderProductSection();
  }
}
productForm.onsubmit = addProductHandler;

// ---------------- Render Products ----------------
async function renderProductSection() {
  const { data: products } = await supabase.from("products").select("*");
  productList.innerHTML = "";

  products.forEach((product) => {
    const card = document.createElement("div");
    card.classList.add("product-card"); // style handled in CSS

    if (product.inStock) {
      card.classList.add("in-stock");
    } else {
      card.classList.add("out-of-stock");
    }

    card.innerHTML = `
      <img src="${product.imageUrl || "placeholder.png"}" alt="${product.name}" class="product-image">
      <h3 class="product-name">${product.name}</h3>
      <p class="product-category"><strong>Category:</strong> ${product.category}</p>
      <p class="product-price"><strong>Price:</strong> Rs. ${parseFloat(product.price).toFixed(2)}</p>
      <p class="product-description">${product.description || ""}</p>
      <p class="product-stock"><strong>${product.inStock ? "In Stock" : "Out of Stock"}</strong></p>
      <button class="add-to-cart-btn" ${!product.inStock ? "disabled" : ""}>Add to Cart</button>
      <button class="order-now-btn" ${!product.inStock ? "disabled" : ""}>Order Now</button>
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

// ✅ add cart count span if not exist
if (!document.querySelector(".cart-count")) {
  const span = document.createElement("span");
  span.className = "cart-count";
  span.textContent = "0";
  cartIcon.appendChild(span);
}

// ✅ Save cart to localStorage
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// ✅ Load cart from localStorage on page load
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

  saveCart(); // ✅ always save after rendering
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

closeCartBtn.addEventListener(
  "click",
  () => (cartSection.style.display = "none")
);

// ---------------- WhatsApp Order ----------------
async function sendWhatsAppOrder(products) {
  if (!products.length) return alert("No products selected!");
  const method = prompt(
    "Select Payment Method:\n1 = Cash on Delivery\n2 = Bank Transfer"
  );

  let payment = "";
  if (method === "1") payment = "Cash on Delivery";
  else if (method === "2") payment = "Bank Transfer";
  else return alert("Invalid selection");

  let message = "Hello, I would like to order the following items:%0A";
  let total = 0;
  products.forEach((p) => {
    total += parseFloat(p.price);
    message += `- ${p.name} (Rs. ${parseFloat(p.price).toFixed(2)})%0A`;
  });
  message += `Total: Rs. ${total.toFixed(
    2
  )}%0APayment Method: ${payment}%0AThank you!`;

  window.open(`https://wa.me/+94788878600?text=${message}`, "_blank");
}

// Add to cart & order now
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("add-to-cart-btn")) {
    const card = e.target.closest(".product-card");
    const product = {
      name: card.querySelector("h3").textContent,
      price: parseFloat(
        card
          .querySelector("p:nth-of-type(2)")
          .textContent.replace("Price: Rs.", "")
          .trim()
      ),
    };
    addToCart(product);
  }
  if (e.target.classList.contains("order-now-btn")) {
    const card = e.target.closest(".product-card");
    const product = {
      name: card.querySelector("h3").textContent,
      price: parseFloat(
        card
          .querySelector("p:nth-of-type(2)")
          .textContent.replace("Price: Rs.", "")
          .trim()
      ),
    };
    sendWhatsAppOrder([product]);
  }
});

checkoutBtn.addEventListener("click", () => {
  sendWhatsAppOrder(cart);
  cart = [];
  renderCart();
  localStorage.removeItem("cart"); // ✅ clear after checkout
});
