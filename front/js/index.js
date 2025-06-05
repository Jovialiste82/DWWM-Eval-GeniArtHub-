// ---------------------------------------------------------------
// ---------- Recuperation des elements du DOM -------------------
// ---------------------------------------------------------------
const productsSection = document.querySelector(".products");

// ---------------------------------------------------------------
// ---------- Fonctions d'interaction avec le DOM ----------------
// ---------------------------------------------------------------
function createArticle(product) {
  const src = product.image ?? "img/01.png";
  const alt = product.titre ?? "Titre produit";
  const href = `product.html?id=${product._id}` ?? "product.html";
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
  const response = await fetch(url);
  const json = await response.json();
  console.log(json);
  return json;
}

// ---------------------------------------------------------------
// ---------- Initialization  ------------------------------------
// ---------------------------------------------------------------

async function init() {
  const products = await getProducts();
  products.forEach((product) => {
    productsSection.appendChild(createArticle(product));
  });
}

init();
