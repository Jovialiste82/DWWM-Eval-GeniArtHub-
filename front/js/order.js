// ---------------------------------------------------------------
// --------------------- Classes ---------------------------------
// ---------------------------------------------------------------
// Creation d'une classe pour gerer le panier et les interactions avec LS
class Cart {
  constructor() {
    this.currentCart = JSON.parse(localStorage.getItem("panier")) || [];
    this.priceTable = [];
    this.finalPrice = 0;
    this.itemsCount = 0;
    this.products = [];
  }

  #updateLocalStorage(updatedCart) {
    // console.log("this.currentCart: ", this.currentCart);
    // console.log("updatedCart: ", updatedCart);
    console.log("Panier mis à jour");
    localStorage.setItem("panier", JSON.stringify(updatedCart));
  }

  #findPrice(productId, taille) {
    return this.priceTable
      .filter((product) => product.productId == productId)
      .filter((product) => product.taille == taille)[0].prix;
  }

  async getProductsIntoCartInstance() {
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
    console.log("this.products: ", this.products);
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
      this.updatePriceAndCountSummaryDisplay();
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
    this.updatePriceAndCountSummaryDisplay();
    this.#updateLocalStorage(this.currentCart);
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
          const taille = declinaison.taille;
          const quantity = declinaison.quantity;
          const template = `
        <li>
          <img src=${image} alt=${titre} />
          <span class="item-title">${titre}</span>
          <span>Format ${taille}</span>
          <span>${prix}€</span>
          <span >Quantité:
                  <input
                    class="item-quantity-box"
                    data-id=${`${product._id}`} 
                    data-taille=${declinaison.taille.split(" ").join(".")}
                    type="number"
                    min="1"
                    max="100"
                    value=${`${quantity}`} />
          </span>
          <a data-id=${`${product._id}`} data-taille=${declinaison.taille
            .split(" ")
            .join(".")} href="#">Supprimer</a>
        </li>
        `;
          ul.insertAdjacentHTML("beforeend", template);
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

      document
        .querySelectorAll("#cart-section ul li .item-quantity-box")
        .forEach((quantityInput) => {
          quantityInput.addEventListener("change", (e) => {
            console.log(e.target.value);
            // this.updateCart(productId, taille, newValue)
          });
        });
    }
  }

  updatePriceTable() {
    this.products.forEach((product) => {
      product.declinaisons.forEach((d) => {
        this.priceTable.push({
          productId: product._id,
          taille: d.taille,
          prix: d.prix,
        });
      });
    });
    console.log(this.priceTable);
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
}

// ---------------------------------------------------------------
// ---------- Interactions avec le DOM ---------------------------
// ---------------------------------------------------------------
const form = document.querySelector("form");

function submitForm(e) {
  e.preventDefault();

  // should double check here if input from user match constraints
  isInputsValidated = validateInputs();

  if (!isInputsValidated) {
    return console.log("inputs are not valid");
  }

  const contact = {
    firstName: document.querySelector("#firstname").value,
    lastName: document.querySelector("#lastname").value,
    address: document.querySelector("#address").value,
    city: document.querySelector("#city").value,
    email: document.querySelector("#email").value,
  };

  console.log("Form is valid. Proceeding...");
  sendOrder(contact);
  console.log(contact);
}

// ---------------------------------------------------------------
// ---------- Fonctions utilitaires ------------------------------
// ---------------------------------------------------------------
function validateInputs() {
  let bool = false;
  console.log("will validate inputs...");
  bool = true; // enable testing rest of form submission
  return bool;
}

// ---------------------------------------------------------------
// ---------- Fonctions d'interaction avec le backend ------------
// ---------------------------------------------------------------
async function sendOrder(contact) {
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
        products: ["def67890", "ghi54321", "jkl98765"],
      }),
    });
    const content = await rawResponse.json();
    console.log(content);
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

// ---------------------------------------------------------------
// ---------- Initialization  ------------------------------------
// ---------------------------------------------------------------

async function init() {
  const cart = new Cart();
  console.log("cart.currentCart: ", cart.currentCart);
  await cart.getProductsIntoCartInstance();
  cart.updatePriceTable();
  cart.renderItemCards();
  cart.updatePriceAndCountSummaryDisplay();
  form.addEventListener("submit", (e) => {
    submitForm(e);
  });
}

init();
