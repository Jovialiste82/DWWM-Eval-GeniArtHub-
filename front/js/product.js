// ---------------------------------------------------------------
// --------------------- Classes  --------------------------------
// ---------------------------------------------------------------
// Creation d'une classe pour gerer la page produit et les interactions avec LS
class ProductPage {
  constructor() {
    this.currentCart = JSON.parse(localStorage.getItem("panier")) || [];
    this.currentProduct = {};
  }

  #updateLocalStorage(updatedCart) {
    console.log("this.currentCart: ", this.currentCart);
    console.log("updatedCart: ", updatedCart);
    console.log("Panier mis à jour");
    localStorage.setItem("panier", JSON.stringify(updatedCart));
  }

  #buildTemplate(src, alt, titre, paragraphe, shorttitle) {
    return `
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
  }

  #displayInitialPrice(product) {
    const showprice = document.querySelector(".showprice");
    const quantity = document.querySelector("#quantity");
    const defaultPrice = product.declinaisons[0].prix;
    showprice.textContent = `${quantity.value * defaultPrice}`;
  }

  #displayDeclinaisons(product, format) {
    const declinaisons = product.declinaisons;
    declinaisons.forEach((declinaison) => {
      const option = document.createElement("option");
      option.setAttribute("value", declinaison.taille);
      option.setAttribute("data-price", declinaison.prix);
      option.textContent = declinaison.taille;
      format.appendChild(option);
    });
  }

  #displayDescription(product, aside) {
    const p = document.createElement("p");
    p.style.padding = "1rem 3rem";
    p.textContent = product.description;
    aside.appendChild(p);
  }

  #updatePrice(format, showprice, quantity) {
    const unitPrice = this.currentProduct.declinaisons.find((object) => {
      return object.taille == format.value;
    }).prix;
    showprice.textContent = `${(quantity.value * unitPrice).toFixed(2)}`;
  }

  async getProductInfo() {
    // On recupere l'id du produit dans l'URL
    let params = new URLSearchParams(document.location.search);
    let productId = params.get("id");
    async function getProduct(productId) {
      try {
        const url = `http://localhost:3000/api/products/${productId}`;
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
    this.currentProduct = (await getProduct(productId)) || {};
    console.log("this.currentProduct: ", this.currentProduct);
  }

  updateCart(format, quantityInput) {
    // A refaire probablement
    const productId = this.currentProduct._id;
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

  updateUI() {
    // Mise a jour du titre de la page
    let newPageTitle = `${this.currentProduct.titre} | GeniArtHub`;
    document.title = newPageTitle;
    console.log("debug!");
    // Securisation des variables
    const src = this.currentProduct.image ?? "img/01.png";
    const alt = this.currentProduct.titre ?? "Titre de l'oeuvre";
    const titre = this.currentProduct.titre ?? "Titre manquant";
    const shorttitle = `Buy ${this.currentProduct.shorttitle}` ?? "Erreur";
    // on cree un mini paragraphe de deux phrases
    const paragraphe =
      `${this.currentProduct.description.split(".").slice(0, 2).join(".")}.` ??
      "Description manquante";

    // Injection des infos de base
    document
      .querySelector(".detailoeuvre")
      .insertAdjacentHTML(
        "beforeend",
        this.#buildTemplate(src, alt, titre, paragraphe, shorttitle, titre)
      );

    // Capture elements du DOM
    const format = document.querySelector("select");
    const showprice = document.querySelector(".showprice");
    const quantity = document.querySelector("#quantity");
    const aside = document.querySelector("aside");
    // Injection des infos complementaires et options
    this.#displayInitialPrice(this.currentProduct);
    this.#displayDeclinaisons(this.currentProduct, format);
    this.#displayDescription(this.currentProduct, aside);
    [format, quantity].forEach((element) => {
      element.addEventListener("change", () => {
        this.#updatePrice(format, showprice, quantity);
      });
    });
    // Un clic d'achat met a jour le panier dans Local Storage
    const buyButton = document.querySelector(".button-buy");
    buyButton.addEventListener("click", () => {
      this.updateCart(format, quantity);
    });
  }
}

// ---------------------------------------------------------------
// ---------- Initialization  ------------------------------------
// ---------------------------------------------------------------

async function init() {
  // On cree un panier
  const productPage = new ProductPage();
  // On recupere les infos du produit
  await productPage.getProductInfo();
  // On met a jour l'UI
  productPage.updateUI();
}

init();
