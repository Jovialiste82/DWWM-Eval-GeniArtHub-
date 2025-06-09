// ---------------------------------------------------------------
// --------------------- Classes ---------------------------------
// ---------------------------------------------------------------
class Panier {
  constructor() {
    this.currentCart = JSON.parse(localStorage.getItem("panier")) || [];
    this.priceTable = []; // Helper tool to find easily prices based on title and foramt
    this.finalPrice = 0; // useful for the display
    this.itemsCount = 0; // useful for the display
    this.products = []; // will store all products to get prices, images, etc
  }

  // ------------- Private Methods ------------------------

  #updateLocalStorage(updatedCart) {
    console.log("Panier mis à jour: ", this.currentCart);
    localStorage.setItem("panier", JSON.stringify(updatedCart));
  }

  #findPrice(productId, taille) {
    return (
      this.priceTable
        // tableau de tous les objets qui ont le meme _id
        .filter((product) => product.productId == productId)
        // tableau avec un seul object correspondant à une taille specifique pour un _id specifique
        .filter((product) => product.taille == taille)[0].prix
    );
  }

  #removeItemAndUpdateCart(productId, taille) {
    let updatedCart = [];
    this.currentCart.forEach((item) => {
      if (item._id != productId) {
        updatedCart.push(item);
      }
      if (item._id == productId && item.declinaisons.length > 1) {
        const newDeclinaisonsArray = item.declinaisons.filter(
          (d) => d.taille !== taille
        );
        const updatedItem = { ...item, declinaisons: newDeclinaisonsArray };
        updatedCart.push(updatedItem);
      }
    });
    this.currentCart = updatedCart;
    this.updatePriceAndCountSummaryDisplay();
    this.#updateLocalStorage(updatedCart);
    this.renderItemCards();
  }

  #updatePriceTable() {
    // Will help find a price based on id and format
    this.priceTable = [];
    this.products.forEach((product) => {
      product.declinaisons.forEach((d) => {
        this.priceTable.push({
          productId: product._id,
          taille: d.taille,
          prix: d.prix,
        });
      });
    });
    console.log("this.priceTable: ", this.priceTable);
  }

  #validateInputs() {
    let bool = false;
    console.log("will validate inputs...");
    // Implement actual validation logic here
    bool = true; // For testing purposes
    return bool;
  }

  #resetAll() {
    this.currentCart = [];
    this.priceTable = [];
    this.finalPrice = 0;
    this.itemsCount = 0;
    this.products = [];
    this.#updateLocalStorage([]);
    document.querySelector("#firstname").value = "";
    document.querySelector("#lastname").value = "";
    document.querySelector("#address").value = "";
    document.querySelector("#city").value = "";
    document.querySelector("#email").value = "";
    const ul = document.querySelector("#cart-section ul");
    const p = document.querySelector("#cart-section .empty-cart");
    ul.textContent = "";
    p.classList.remove("hidden");
    this.updatePriceAndCountSummaryDisplay();
  }

  #buildTemplate(image, titre, prix, product, declinaison) {
    return `
        <li>
          <img src=${image} alt=${titre} />
          <span class="item-title">${titre}</span>
          <span>Format ${declinaison.taille}</span>
          <span>${prix}€</span>
          <span >Quantité:
                  <input
                    class="item-quantity-box"
                    data-id=${`${product._id}`} 
                    data-taille=${declinaison.taille.split(" ").join(".")}
                    type="number"
                    min="1"
                    max="100"
                    value=${`${declinaison.quantity}`} />
          </span>
          <a data-id=${`${product._id}`} data-taille=${declinaison.taille
      .split(" ")
      .join(".")} href="#">Supprimer</a>
        </li>
`;
  }

  async #submitForm(e) {
    e.preventDefault();

    // Validate inputs
    const isInputsValidated = this.#validateInputs();

    if (!isInputsValidated) {
      return console.log("inputs are not valid");
    }

    // Check if cart is not empty and prepare products list
    const productIds = this.currentCart.map((item) => item._id);
    if (productIds.length == 0) {
      return alert("Votre panier est vide!");
    }

    const contact = {
      firstName: document.querySelector("#firstname").value,
      lastName: document.querySelector("#lastname").value,
      address: document.querySelector("#address").value,
      city: document.querySelector("#city").value,
      email: document.querySelector("#email").value,
    };

    try {
      const response = await this.#sendOrder(contact, productIds);
      if (!response.orderId) {
        console.log("an issue occurred");
      }

      return response;
    } catch (error) {
      console.error(error);
      return { error };
    }
  }

  async #sendOrder(contact, productIds) {
    const url = "http://localhost:3000/api/products/order";
    try {
      const rawResponse = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contact,
          products: productIds,
        }),
      });
      const response = await rawResponse.json();
      return response;
    } catch (error) {
      const response = {
        error,
        url,
        message: "Error sending order",
      };
      console.log(error.message);
      return response;
    }
  }

  // ------------- Public Methods ------------------------

  async getProductsInfoAndUpdatePriceTable() {
    async function getProductsFromBackend() {
      const url = "http://localhost:3000/api/products/";
      try {
        const response = await fetch(url);
        const json = await response.json();
        return json;
      } catch (error) {
        console.log("Error: ", error);
      }
    }

    this.products = (await getProductsFromBackend()) || [];
    this.#updatePriceTable();
  }

  renderItemCards() {
    const ul = document.querySelector("#cart-section ul");
    const p = document.querySelector("#cart-section .empty-cart");
    ul.textContent = "";
    if (this.currentCart.length == 0) {
      p.classList.remove("hidden");
    } else {
      this.currentCart.forEach((product) => {
        product.declinaisons.forEach((declinaison) => {
          const image = this.products.find((p) => p._id == product._id).image;
          const titre = this.products.find((p) => p._id == product._id).titre;
          const prix = this.products
            .find((p) => p._id == product._id)
            .declinaisons.find((d) => d.taille == declinaison.taille).prix;
          ul.insertAdjacentHTML(
            "beforeend",
            this.#buildTemplate(image, titre, prix, product, declinaison)
          );
        });
      });
      p.classList.add("hidden");
    }
    if (ul.textContent) {
      document
        .querySelectorAll("#cart-section ul li a")
        .forEach((deleteButton) => {
          deleteButton.addEventListener("click", (e) => {
            this.#removeItemAndUpdateCart(
              e.target.dataset.id,
              e.target.dataset.taille.split(".").join(" ")
            );
          });
        });
    }
  }

  updatePriceAndCountSummaryDisplay() {
    const display = document.querySelector(".summary-cart-display");
    // check if cart is empty
    if (this.currentCart.length == 0) {
      display.textContent = "0 article pour un montant de 0 €";
      return;
    }
    // Reset
    this.finalPrice = 0;
    this.itemsCount = 0;
    // Calculate Final Price
    this.currentCart.forEach((item) => {
      item.declinaisons.forEach((d) => {
        const unitPrice = this.#findPrice(item._id, d.taille);
        const quantity = d.quantity;
        const amount = unitPrice * quantity;
        this.finalPrice += amount;
        // console.log(this.finalPrice);
      });
    });
    // Calculate items count
    this.currentCart.forEach((item) => {
      item.declinaisons.forEach((d) => {
        this.itemsCount += d.quantity;
      });
    });
    // update UI
    display.textContent = `${this.itemsCount} article${
      this.itemsCount > 1 ? "s" : ""
    } pour un montant de ${this.finalPrice.toFixed(2)} €`;
  }

  addEventListeners() {
    const form = document.querySelector("form");
    const closeModalButton = document.querySelector(".modal-card span");
    form.addEventListener("submit", async (e) => {
      try {
        const response = await this.#submitForm(e);
        console.log("response: ", response);
        if (response && response.orderId) {
          const modal = document.querySelector(".modal-filter");
          const modalCard = document.querySelector(".modal-card");
          const p = document.createElement("p");
          p.textContent = `Voici votre numéro de commande: ${response.orderId}`;
          modalCard.appendChild(p);
          modal.classList.remove("hidden");
          this.#resetAll();
        }
      } catch (error) {
        console.log(error);
      }
    });
    closeModalButton.addEventListener("click", (e) => {
      e.target.parentElement.parentElement.classList.add("hidden");
    });
  }
}

// ---------------------------------------------------------------
// ---------- Initialization  ------------------------------------
// ---------------------------------------------------------------

async function init() {
  const panier = new Panier();
  console.log("panier.currentCart: ", panier.currentCart);
  await panier.getProductsInfoAndUpdatePriceTable();
  panier.renderItemCards();
  panier.updatePriceAndCountSummaryDisplay();
  panier.addEventListeners();
}

init();
