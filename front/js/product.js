// ---------------------------------------------------------------
// --------------------- Classes  --------------------------------
// ---------------------------------------------------------------
// Creation d'une classe pour gerer la page produit et les interactions avec LS
class ProductPage {
  constructor() {
    this.currentCart = JSON.parse(localStorage.getItem("panier")) || [];
    this.currentProduct = {};
    this.maxOrderLimits = [];
  }

  // ----------------- Private Methods ---------------------
  #updateLocalStorage(updatedCart) {
    console.log("Panier mis à jour: ", updatedCart);
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
                    <span class="showprice"></span>
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
            <h2>Description de l’oeuvre : ${titre}</h2>
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

  #updatePrice(format, quantity) {
    const showprice = document.querySelector(".showprice");
    const unitPrice = this.currentProduct.declinaisons.find((object) => {
      return object.taille == format.value;
    }).prix;
    showprice.textContent = `${(quantity.value * unitPrice).toFixed(2)}`;
  }

  #updatemaxOrderLimits() {
    this.maxOrderLimits = []; // reset
    this.maxOrderLimits = this.currentCart
      .find((product) => product._id == this.currentProduct._id)
      .declinaisons.map((d) => {
        return {
          taille: d.taille,
          maxOrderLimits: 100 - d.quantity,
        };
      });
    console.log("this.maxOrderLimits: ", this.maxOrderLimits);
  }

  #updateCart() {
    const format = document.querySelector("select");
    const quantity = document.querySelector("#quantity");
    const productId = this.currentProduct._id;
    const selectedSize = format.value;
    const quantityToAdd = parseInt(quantity.value, 10);
    console.log("this.maxOrderLimits: ", this.maxOrderLimits);
    const currentMaxValue = this.maxOrderLimits.find(
      (object) => object.taille == format.value
    )
      ? this.maxOrderLimits.find((object) => object.taille == format.value)
          .maxOrderLimits
      : 100;

    // We stop the script if we've reached the units limit
    if (currentMaxValue < 1) {
      alert("Limite atteinte!");
      return;
    }

    // Otherwise we move on and update the cart
    const existingProduct = this.currentCart.find(
      (item) => item._id === productId
    );
    this.currentCart = this.currentCart.filter(
      (item) => item._id !== productId
    );

    // Case 1 : product is not in cart yet
    if (!existingProduct) {
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
    }

    // Case 2 : product already in cart, so we check if declinaison already exists
    if (existingProduct) {
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
              ? {
                  ...declinaison,
                  quantity: declinaison.quantity + quantityToAdd,
                }
              : declinaison
        );
      }
      this.currentCart.push(existingProduct);
    }

    // Moving on with the script
    this.#updateLocalStorage(this.currentCart);
    this.#updatemaxOrderLimits();
    const nextMaxValue = this.maxOrderLimits.find(
      (object) => object.taille == format.value
    ).maxOrderLimits;
    console.log("maxValue: ", nextMaxValue);
    quantity.setAttribute("max", String(nextMaxValue));
    quantity.value = 1;
    if (nextMaxValue < 1) {
      quantity.setAttribute("disabled", "true");
    }
    alert("Panier mis à jour..");
  }

  async #getProduct(productId) {
    try {
      const url = `http://localhost:3000/api/products/${productId}`;
      const response = await fetch(url);
      const json = await response.json();
      return json;
    } catch (error) {
      console.log(error);
      return {};
    }
  }

  // ------------- Public Methods ------------------------
  async getProductInfo() {
    // On recupere l'id du produit dans l'URL
    let params = new URLSearchParams(document.location.search);
    let productId = params.get("id");
    this.currentProduct = (await this.#getProduct(productId)) || {};
  }

  paintInitialUI() {
    // Mise a jour du titre de la page
    let newPageTitle = `${this.currentProduct.titre} | GeniArtHub`;
    document.title = newPageTitle;
    // Securisation des variables
    const src = this.currentProduct.image ?? "img/01.png";
    const alt = this.currentProduct.titre ?? "Titre de l'oeuvre";
    const titre = this.currentProduct.titre ?? "Titre manquant";
    const shorttitle = this.currentProduct.shorttitle
      ? `Buy ${this.currentProduct.shorttitle}`
      : "Nothing to buy I am afraid";
    // on cree un mini paragraphe de deux phrases
    const paragraphe =
      `${this.currentProduct.description.split(".").slice(0, 2).join(".")}.` ??
      "Description manquante";

    // Injection des infos de base
    document
      .querySelector(".detailoeuvre")
      .insertAdjacentHTML(
        "beforeend",
        this.#buildTemplate(src, alt, titre, paragraphe, shorttitle)
      );

    // Capture elements du DOM
    const format = document.querySelector("select");
    const quantity = document.querySelector("#quantity");
    const aside = document.querySelector("aside");
    // Injection des infos complementaires et options
    this.#displayInitialPrice(this.currentProduct);
    this.#displayDeclinaisons(this.currentProduct, format);
    this.#displayDescription(this.currentProduct, aside);
    [format, quantity].forEach((element) => {
      element.addEventListener("change", () => {
        this.#updatePrice(format, quantity);
      });
    });
    // Un clic d'achat met a jour le panier dans Local Storage
    const buyButton = document.querySelector(".button-buy");
    buyButton.addEventListener("click", () => {
      this.#updateCart(format, quantity);
    });
  }
}

// ---------------------------------------------------------------
// ---------- Initialization  ------------------------------------
// ---------------------------------------------------------------

async function init() {
  const productPage = new ProductPage();
  await productPage.getProductInfo();
  productPage.paintInitialUI();
}

init();
