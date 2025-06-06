// ---------------------------------------------------------------
// ---------- Fonctions d'interaction avec le DOM ----------------
// ---------------------------------------------------------------
function addProductContentToSection(product) {
  // Securisation des variables
  const src = product.image ?? "img/01.png";
  const alt = product.titre ?? "Titre de l'oeuvre";
  const titre = product.titre ?? "Titre manquant";
  const shorttitle = `Buy ${product.shorttitle}` ?? "Erreur";
  // on cree un mini paragraphe de deux phrases
  const paragraphe =
    `${product.description.split(".").slice(0, 2).join(".")}.` ??
    "Description manquante";
  // On cree le template a injecter
  const template = `
        <article>
            <figure>
                <img src=${src} alt=${alt}>
            </figure>
            <div>
                <h1>${titre}</h1>
                <p>${paragraphe}</p>
                <div class="price">
                    <p>Acheter pour</p>
                    <span class="showprice">40€</span>
                </div>
                <div class="declinaison">
                    <input type="number" name="quantity" id="quantity" placeholder="1" value="1" min="1" max="100" minlength="1">
                    <select name="format" id="format">
                    </select>
                </div>
                <a class="button-buy" href="#">${shorttitle}</a>
            </div>
        </article>

        <aside>
            <h2>Description de l’oeuvre :  ${titre}</h2>
        </aside>
`;
  return template;
}

function displayInitialPrice(product) {
  const showprice = document.querySelector(".showprice");
  const quantity = document.querySelector("#quantity");
  const defaultPrice = product.declinaisons[0].prix;
  showprice.textContent = `${quantity.value * defaultPrice}`;
}

function displayDeclinaisons(product, format) {
  const declinaisons = product.declinaisons;
  declinaisons.forEach((declinaison) => {
    const option = document.createElement("option");
    option.setAttribute("value", declinaison.taille);
    option.setAttribute("data-price", declinaison.prix);
    option.textContent = declinaison.taille;
    format.appendChild(option);
  });
}

function displayDescription(product, aside) {
  const p = document.createElement("p");
  p.style.padding = "1rem 3rem";
  p.textContent = product.description;
  aside.appendChild(p);
}

function updatePrice(product, format, showprice, quantity) {
  const unitPrice = product.declinaisons.find((object) => {
    return object.taille == format.value;
  }).prix;
  showprice.textContent = `${(quantity.value * unitPrice).toFixed(2)}`;
}

// ---------------------------------------------------------------
// --------------------- Classes  --------------------------------
// ---------------------------------------------------------------
// Creation d'une classe pour gerer le panier et les interactions avec LS
class Cart {
  constructor() {
    this.currentCart = JSON.parse(localStorage.getItem("panier")) || [];
  }

  #updateLocalStorage(updatedCart) {
    console.log("this.currentCart: ", this.currentCart);
    console.log("updatedCart: ", updatedCart);
    console.log("Panier mis à jour");
    localStorage.setItem("panier", JSON.stringify(updatedCart));
  }

  updateCart(product, format, quantityInput) {
    // A refaire probablement
    const productId = product._id;
    const selectedSize = format.value;
    const quantityToAdd = parseInt(quantityInput.value, 10);
    const existingProduct = this.currentCart.find(
      (item) => item._id === productId
    );
    this.currentCart = this.currentCart.filter(
      (item) => item._id !== productId
    );

    if (!existingProduct) {
      // If product not in cart yet
      const newProduct = {
        _id: productId,
        declinaisons: [
          {
            taille: selectedSize,
            quantity: quantityToAdd,
          },
        ],
      };

      this.currentCart.push(newProduct);
      this.#updateLocalStorage(this.currentCart);
      return;
    }

    // Check if the size already exists in the declinaisons
    const existingDeclinaison = existingProduct.declinaisons.find(
      (declinaison) => declinaison.taille === selectedSize
    );

    if (!existingDeclinaison) {
      // if size doesn't exist yet, add it
      existingProduct.declinaisons.push({
        taille: selectedSize,
        quantity: quantityToAdd,
      });
    } else {
      // if size exists, update quantity
      existingProduct.declinaisons = existingProduct.declinaisons.map(
        (declinaison) =>
          declinaison.taille === selectedSize
            ? { ...declinaison, quantity: declinaison.quantity + quantityToAdd }
            : declinaison
      );
    }

    this.currentCart.push(existingProduct);
    this.#updateLocalStorage(this.currentCart);
  }
}

// ---------------------------------------------------------------
// ---------- Fonctions d'interaction avec le backend ------------
// ---------------------------------------------------------------
async function getProduct(productId) {
  const url = `http://localhost:3000/api/products/${productId}`;
  try {
    const response = await fetch(url);
    const json = await response.json();
    // console.log(json);
    return json;
  } catch (error) {
    return {
      error,
      url,
      message: "Error fetching product",
    };
  }
}

// ---------------------------------------------------------------
// ---------- Initialization  ------------------------------------
// ---------------------------------------------------------------

async function init() {
  // On cree un panier
  const cart = new Cart();
  // On recupere l'id du produit dans l'URL
  let params = new URLSearchParams(document.location.search);
  let productId = params.get("id");
  // On fait un appel vers le backend pour recuperer les infos du produit
  const product = await getProduct(productId);
  // On gere l'erreur potentielle
  if (product.error) return console.log(product.message);
  // On met a jour l'UI
  const template = addProductContentToSection(product);
  const productsSection = document.querySelector(".detailoeuvre");
  productsSection.insertAdjacentHTML("beforeend", template);
  // Mise a jour du titre de la page
  newPageTitle = `${product.titre} | GeniArtHub`;
  document.title = newPageTitle;
  // Capture d'elements du DOM utiles pour la suite
  const format = document.querySelector("select");
  const showprice = document.querySelector(".showprice");
  const quantity = document.querySelector("#quantity");
  // On implemente les options de declinaisons
  displayDeclinaisons(product, format);
  // On affiche le prix de base
  displayInitialPrice(product);
  // On affiche la description complete
  const aside = document.querySelector("aside");
  displayDescription(product, aside);
  // A chaque changement de format ou de quantité on recalcule le prix
  [format, quantity].forEach((element) => {
    element.addEventListener("change", () => {
      updatePrice(product, format, showprice, quantity);
    });
  });
  // Un clic d'achat met a jour le panier dans Local Storage
  const buyButton = document.querySelector(".button-buy");
  buyButton.addEventListener("click", () => {
    cart.updateCart(product, format, quantity);
  });
}

init();
