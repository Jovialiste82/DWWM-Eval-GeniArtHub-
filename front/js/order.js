// ---------------------------------------------------------------
// --------------------- Classes  --------------------------------
// ---------------------------------------------------------------
// Creation d'une classe pour gerer le panier et les interactions avec LS
class Cart {
  constructor() {
    this.currentCart = JSON.parse(localStorage.getItem("panier")) || [];
    this.priceTable = [];
    this.finalPrice = 0;
  }

  // To be used only inside the Class
  #updateLocalStorage(updatedCart, product) {
    updatedCart.push(product);
    this.currentCart = updatedCart;
    // console.log("this.currentCart: ", this.currentCart);
    console.log("Panier mis à jour");
    localStorage.setItem("panier", JSON.stringify(updatedCart));
  }

  updateCart(product, format, quantityInput) {
    const productId = product._id;
    const selectedSize = format.value;
    const quantityToAdd = parseInt(quantityInput.value, 10);
    const existingProduct = this.currentCart.find(
      (item) => item._id === productId
    );
    const updatedCart = this.currentCart.filter(
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

      this.#updateLocalStorage(updatedCart, newProduct);
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

    this.#updateLocalStorage(updatedCart, existingProduct);
  }

  renderItems(domFunction) {}

  updatePriceTable(products) {
    products.forEach((product) => {
      product.declinaisons.forEach((d) => {
        const array = [product._id, d.taille, d.prix];
        this.priceTable.push(array);
      });
    });
    console.log(this.priceTable);
  }

  calculateFinalPrice() {
    this.finalPrice = 0;
    this.currentCart.forEach((item) => {
      item.declinaisons.forEach((d) => {
        const unitPrice = this.priceTable
          .filter((product) => product[0] == item._id)
          .filter((product) => product[1] == d.taille)[0][2];
        const quantity = d.quantity;
        const amount = unitPrice * quantity;
        this.finalPrice += amount;
      });
    });
    console.log(this.finalPrice);
  }
}

// ---------------------------------------------------------------
// ---------- Interactions avec le DOM ---------------------------
// ---------------------------------------------------------------
const form = document.querySelector("form");

// Form submission upon click
form.addEventListener("submit", (e) => {
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
});

function createItemCards(product) {
  const template = `
    <li>
      <img src=${product.image} alt=${product.titre} />
      <span class="item-title">${product.titre}</span>
      <span>Format ${product.declinaisons[0].taille}</span>
      <span>${product.declinaisons[0].prix}€</span>
      <span>Quantité:
              <input
                class="item-quantity-box"
                type="number"
                min="1"
                max="100"
                value=${`${1}`} />
      </span>
      <a href="#">Supprimer</a>
    </li>
    `;
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

async function getProducts() {
  const url = "http://localhost:3000/api/products/";
  try {
    const response = await fetch(url);
    const json = await response.json();
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
  // initialize a Cart instance
  const cart = new Cart();
  // fetch products to get prices
  const products = await getProducts();
  cart.updatePriceTable(products);
  cart.calculateFinalPrice();
  // fetch cart in local storage
  // if there is a cart, build and display the item cards
}

init();
