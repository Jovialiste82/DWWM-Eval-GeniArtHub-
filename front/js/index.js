// ---------------------------------------------------------------
// ---------- Fonctions d'interaction avec le DOM ----------------
// ---------------------------------------------------------------
function createArticle(product) {
  const src = product.image ?? "img/01.png";
  const alt = product.titre ?? "Titre produit";
  const href = product._id ? `product.html?id=${product._id}` : "product.html";
  const shorttitle = product.shorttitle ?? "Bird";
  const article = document.createElement("article");
  const img = document.createElement("img");
  const a = document.createElement("a");
  img.setAttribute("src", src);
  img.setAttribute("alt", alt);
  a.setAttribute("href", href);
  a.textContent = `Buy ${shorttitle}`;
  article.appendChild(img);
  article.appendChild(a);
  return article;
}

// ---------------------------------------------------------------
// ---------- Fonctions d'interaction avec le backend ------------
// ---------------------------------------------------------------
async function getProducts() {
  const url = "http://localhost:3000/api/products/";
  try {
    const response = await fetch(url);
    const json = await response.json();
    console.log(json);
    return json;
  } catch (error) {
    return {
      error,
      url,
      message: "Error fetching products",
    };
  }
}

// ---------------------------------------------------------------
// ---------- Initialization  ------------------------------------
// ---------------------------------------------------------------

async function init() {
  const productsSection = document.querySelector(".products");
  const products = await getProducts();
  if (products.error) return console.log(products.message);
  products.forEach((product) => {
    productsSection.appendChild(createArticle(product));
  });
}

init();
