const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

// Middleware
app.use(express.json());

// Helper functions
const readProducts = () => {
  try {
    if (!fs.existsSync(PRODUCTS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading products file:', error);
    return [];
  }
};

const writeProducts = (products) => {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing products file:', error);
    return false;
  }
};

const getNextId = (products) => {
  if (products.length === 0) return 1;
  return Math.max(...products.map(p => p.id)) + 1;
};

// Routes

// GET /products - return all products
app.get('/products', (req, res) => {
  try {
    const products = readProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /products/instock - return only products where inStock is true
app.get('/products/instock', (req, res) => {
  try {
    const products = readProducts();
    const inStockProducts = products.filter(product => product.inStock === true);
    res.json(inStockProducts);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /products - create a new product
app.post('/products', (req, res) => {
  try {
    const { name, price, inStock } = req.body;
    
    // Validate required fields
    if (!name || price === undefined || inStock === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields. Please provide name, price, and inStock.' 
      });
    }
    
    // Validate data types
    if (typeof name !== 'string' || typeof price !== 'number' || typeof inStock !== 'boolean') {
      return res.status(400).json({ 
        error: 'Invalid data types. Name should be string, price should be number, inStock should be boolean.' 
      });
    }
    
    const products = readProducts();
    const newProduct = {
      id: getNextId(products),
      name,
      price,
      inStock
    };
    
    products.push(newProduct);
    
    if (writeProducts(products)) {
      res.status(201).json(newProduct);
    } else {
      res.status(500).json({ error: 'Failed to save product' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /products/:id - update an existing product
app.put('/products/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, price, inStock } = req.body;
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    const products = readProducts();
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Validate data types if provided
    if (name !== undefined && typeof name !== 'string') {
      return res.status(400).json({ error: 'Name must be a string' });
    }
    if (price !== undefined && typeof price !== 'number') {
      return res.status(400).json({ error: 'Price must be a number' });
    }
    if (inStock !== undefined && typeof inStock !== 'boolean') {
      return res.status(400).json({ error: 'inStock must be a boolean' });
    }
    
    // Update only provided fields
    if (name !== undefined) products[productIndex].name = name;
    if (price !== undefined) products[productIndex].price = price;
    if (inStock !== undefined) products[productIndex].inStock = inStock;
    
    if (writeProducts(products)) {
      res.json(products[productIndex]);
    } else {
      res.status(500).json({ error: 'Failed to update product' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /products/:id - delete a product
app.delete('/products/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    
    const products = readProducts();
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    products.splice(productIndex, 1);
    
    if (writeProducts(products)) {
      res.json({ message: 'Product deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete product' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('GET    /products        - Get all products');
  console.log('GET    /products/instock - Get products in stock');
  console.log('POST   /products        - Create a new product');
  console.log('PUT    /products/:id    - Update a product');
  console.log('DELETE /products/:id    - Delete a product');
});
