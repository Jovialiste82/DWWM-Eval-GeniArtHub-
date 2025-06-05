const uuid = require('uuid/v1');
const Product = require('../models/Product');

exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    const mappedProducts = products.map((product) => {
      // product.imageUrl = `${req.protocol}://${req.get('host')}/images/${product.Image}`;
      return product;
    });
    res.status(200).json(mappedProducts);
  } catch (error) {
    res.status(500).json({ error: 'Database error!' });
  }
};

exports.getOneProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found!' });
    }
    // product.imageUrl = `${req.protocol}://${req.get('host')}/images/${product.Image}`;
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Database error!' });
  }
};

/**
 *
 * Expects request to contain:
 * contact: {
 *   firstName: string,
 *   lastName: string,
 *   address: string,
 *   city: string,
 *   email: string
 * }
 * products: [string] <-- array of product _id
 *
 */
exports.orderProducts = async (req, res, next) => {
  if (
    !req.body.contact ||
    !req.body.contact.firstName ||
    !req.body.contact.lastName ||
    !req.body.contact.address ||
    !req.body.contact.city ||
    !req.body.contact.email ||
    !req.body.products
  ) {
    return res.status(400).json({ error: 'Bad request!' });
  }

  /* The code is creating an array of promises called `queries`. Each promise represents a database
  query to find a product by its ID. */
  const queries = req.body.products.map(async (productId) => {
    try {
     /* The code is trying to find a product in the database based on the provided `productId`. */
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }
      product.image = `${req.protocol}://${req.get('host')}/images/${product.image}`;
      return product;
    } catch (error) {
      throw new Error('Database error!');
    }
  });

  try {
    const products = await Promise.all(queries);
    const orderId = uuid();
    res.status(201).json({
      contact: req.body.contact,
      products,
      orderId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};