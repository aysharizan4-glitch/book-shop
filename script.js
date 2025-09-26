// ================= Supabase Setup =================
const SUPABASE_URL = "https://mjkixzefsmdusxtutoif.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qa2l4emVmc21kdXN4dHV0b2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTk2NzksImV4cCI6MjA3NDQ5NTY3OX0.kaMS_NQ7p9xnCV252aghbXk4esazxxTyuGTLBePTHTo";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ================= Admin Panel Toggle =================
document.addEventListener("DOMContentLoaded", () => {
  const adminBtn = document.getElementById('adminBtn');
  const adminPanel = document.querySelector('.form-section');
  const closeAdminBtn = document.getElementById('closeAdminBtn');

  if (!adminBtn || !adminPanel || !closeAdminBtn) return;

  adminBtn.addEventListener('click', () => {
    const password = prompt("Enter Admin Password:");
    if (password === 'admin123') {
      adminPanel.style.display = 'block';
      adminPanel.scrollIntoView({ behavior: "smooth" });
    } else {
      alert("Incorrect password!");
    }
  });

  closeAdminBtn.addEventListener('click', () => {
    adminPanel.style.display = 'none';
  });

  // Load products from Supabase on page load
  loadProductsFromSupabase();
});

// ================= Load Products Function =================
async function loadProductsFromSupabase() {
  try {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    products = data;
    renderProducts();
  } catch (err) {
    console.error("Failed to fetch products:", err.message);
  }
}


// ================= Product System =================
let products = [];
let cart = [];

// DOM Elements
const productFormEl = document.getElementById('productForm');
const adminProductListEl = document.querySelector('.admin-product-list');
const productListEl = document.querySelector('.product-list');
const cartIcon = document.querySelector('.cart');

productFormEl.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('productName').value.trim();
  const price = document.getElementById('productPrice').value.trim();
  const category = document.getElementById('productCategory').value.trim();
  const description = document.getElementById('productDescription').value.trim();
  const inStock = document.getElementById('inStock').checked;
  const featured = document.getElementById('featured').checked;
  const imageFile = document.getElementById('productImage').files[0];

  let imageUrl = "https://via.placeholder.com/150?text=No+Image";

  if (imageFile) {
    // Upload image to Supabase storage
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { data, error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, imageFile);

    if (!uploadError) {
      const { publicUrl } = supabase.storage.from('products').getPublicUrl(fileName);
      imageUrl = publicUrl;
    } else {
      console.error("Image upload failed:", uploadError.message);
    }
  }

  // Insert product into Supabase table
  const { data: insertData, error: insertError } = await supabase
    .from('products')
    .insert([{ name, price, category, description, inStock, featured, image: imageUrl }]);

  if (!insertError) {
    alert("✅ Product added successfully!");
    // Fetch products again from Supabase to render
    loadProductsFromSupabase();
    productFormEl.reset();
  } else {
    console.error("Product insert failed:", insertError.message);
  }
});

// Function to load products from Supabase
async function loadProductsFromSupabase() {
  const { data, error } = await supabase.from('products').select('*');
  if (!error) {
    products = data;
    renderProducts();
  } else {
    console.error("Failed to fetch products:", error.message);
  }
}

// Call this on page load
loadProductsFromSupabase();


// ================= Cart System =================
function updateCartCount() {
  if (cartIcon) {
    cartIcon.textContent = "🛒 " + cart.length;
  }
}
// ================= Cart Checkout =================
const cartSection = document.getElementById('cartSection');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const closeCartBtn = document.getElementById('closeCartBtn');

// Open Cart when click on cart icon
cartIcon.addEventListener('click', () => {
  renderCart();
  cartSection.style.display = 'block';
  cartSection.scrollIntoView({ behavior: "smooth" });
});

// Close cart
closeCartBtn.addEventListener('click', () => {
  cartSection.style.display = 'none';
});

// Render Cart items + Total
function renderCart() {
  cartItemsEl.innerHTML = '';
  let total = 0;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = "<p>Your cart is empty.</p>";
  } else {
    cart.forEach((item, i) => {
      total += parseFloat(item.price);
      const div = document.createElement('div');
      div.style.marginBottom = "10px";
      div.style.display = "flex";
      div.style.justifyContent = "space-between";
      div.style.alignItems = "center";
      div.innerHTML = `
        <span><strong>${item.name}</strong> - LKR ${parseFloat(item.price).toFixed(2)}</span>
        <button data-index="${i}" class="removeCartBtn" 
          style="padding:5px 10px;background:#dc3545;color:#fff;border:none;border-radius:4px;cursor:pointer;">
          Remove
        </button>
      `;
      cartItemsEl.appendChild(div);
    });
  }

  // update total live
  cartTotalEl.textContent = "Total: LKR " + total.toFixed(2);

  // attach remove button events
  document.querySelectorAll('.removeCartBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const i = e.target.dataset.index;
      cart.splice(i, 1);        // remove item from array
      updateCartCount();        // update badge
      renderCart();             // refresh cart list + total instantly
    });
  });
}

// Checkout button → WhatsApp
checkoutBtn.addEventListener('click', () => {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  let message = "Hello AYSHLYNE,%0A%0AI want to checkout:%0A";
  let total = 0;

  cart.forEach(item => {
    message += - ${item.name} | LKR ${parseFloat(item.price).toFixed(2)}%0A;
    total += parseFloat(item.price);
  });

  message += %0ATotal: LKR ${total.toFixed(2)}%0A%0AThanks!;

  const whatsappURL = `https://wa.me/94788878600?text=${message}`;
  window.open(whatsappURL, '_blank');
});

Rizan Mohamed, [26/09/2025 23:53]
// ================= Render Products =================
function renderProducts() {
  if (!productListEl || !adminProductListEl) return;

  // --- Admin Panel ---
  adminProductListEl.innerHTML = '';
  products.forEach((product, index) => {
    const adminCard = document.createElement('div');
    adminCard.classList.add('feature');
    adminCard.innerHTML = `
      <h4>${product.name}</h4>
      <img src="${product.image}" alt="${product.name}" style="width:80px;height:100px;object-fit:cover;margin-bottom:10px;">
      <p>Price: LKR ${parseFloat(product.price).toFixed(2)}</p>
      <p>Category: ${product.category}</p>
      <p>${product.description}</p>
      <p>Stock: <span style="padding:2px 6px;border-radius:5px;color:#fff;font-size:12px; background:${product.inStock ? '#28a745' : '#dc3545'}">${product.inStock ? 'In Stock' : 'Out of Stock'}</span></p>
      <button class="edit-btn btn" data-index="${index}">Edit</button>
      <button class="delete-btn btn" style="background-color:#666" data-index="${index}">Delete</button>
    `;
    adminProductListEl.appendChild(adminCard);
  });

  // --- Product Section ---
  productListEl.innerHTML = '';
  products.forEach((product, index) => {
    const productCard = document.createElement('div');
    productCard.classList.add('feature');
    productCard.style.flex = "1 1 calc(50% - 20px)"; // 2 by 2 in row
    productCard.style.boxSizing = "border-box";

    productCard.innerHTML = `
      <h4 style="font-size:18px;font-weight:bold;margin-bottom:5px;">${product.name}</h4>
      <img src="${product.image}" alt="${product.name}" style="width:150px;height:150px;object-fit:cover;margin-bottom:10px;">
      <p style="background:#f1f1f1;padding:5px 10px;display:inline-block;border-radius:5px;margin-bottom:5px;">LKR ${parseFloat(product.price).toFixed(2)}</p>
      <p style="font-size:14px;color:#555;margin-bottom:3px;">${product.category}</p>
      <p style="font-size:12px;color:#777;margin-bottom:5px;">${product.description}</p>
      <p>Stock: <span style="padding:2px 6px;border-radius:5px;color:#fff;font-size:12px; background:${product.inStock ? '#28a745' : '#dc3545'}">${product.inStock ? 'In Stock' : 'Out of Stock'}</span></p>
      <div style="margin-top:10px;display:flex;gap:10px;justify-content:center;">
        <button class="cart-btn" data-index="${index}" style="flex:1;padding:8px 12px;background:#007bff;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:14px;">Add to Cart</button>
        <button class="order-btn" data-index="${index}" style="flex:1;padding:8px 12px;background:#28a745;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:14px;">Order Now</button>
      </div>
    `;
    productListEl.appendChild(productCard);
  });

  saveProducts();
}

// ================= Add / Edit Product =================
productFormEl.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('productName').value.trim();
  const price = document.getElementById('productPrice').value.trim();
  const category = document.getElementById('productCategory').value.trim();
  const description = document.getElementById('productDescription').value.trim();
  const inStock = document.getElementById('inStock').checked;
  const featured = document.getElementById('featured').checked;
  const imageFile = document.getElementById('productImage').files[0];

  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const image = event.target.result;
      const product = { name, price, category, description, inStock, featured, image };
      products.push(product);
      renderProducts();
      productFormEl.reset();
    };
    reader.readAsDataURL(imageFile);
  } else {
    const image = "https://via.placeholder.com/150?text=No+Image";
    const product = { name, price, category, description, inStock, featured, image };
    products.push(product);
    renderProducts();
    productFormEl.reset();
  }
});

Rizan Mohamed, [26/09/2025 23:53]
// ================= Delete / Edit Product =================
adminProductListEl.addEventListener('click', (e) => {
  const index = e.target.dataset.index;
  if (e.target.classList.contains('delete-btn')) {
    products.splice(index, 1);
    renderProducts();
  }
  if (e.target.classList.contains('edit-btn')) {
    const product = products[index];
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('inStock').checked = product.inStock;
    document.getElementById('featured').checked = product.featured;
    products.splice(index, 1);
    renderProducts();
  }
});

// ================= Cart & Order Buttons =================
productListEl.addEventListener('click', (e) => {
  const index = e.target.dataset.index;
  if (e.target.classList.contains('cart-btn')) {
    cart.push(products[index]);
    updateCartCount();
    alert(✅ "${products[index].name}" added to cart!);
  }
  if (e.target.classList.contains('order-btn')) {
    const product = products[index];
    const message = Hello AYSHLYNE,%0A%0AI want to order:%0A- ${product.name}%0A- Price: LKR ${parseFloat(product.price).toFixed(2)}%0A- Category: ${product.category}%0A- ${product.inStock ? 'In Stock' : 'Out of Stock'}%0A%0AThanks!;
    const whatsappURL = `https://wa.me/94788878600?text=${message}`;
    window.open(whatsappURL, '_blank');
  }
});