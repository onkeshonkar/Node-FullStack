const fs = require('fs');
const path = require('path');

const p = path.join(path.dirname(process.mainModule.filename),
    'data',
    'cart.json'
);

module.exports = class Cart {
    static addProduct(id, productPrice) {
        // Fetch the previous cart
        fs.readFile(p, (err, fileContent) => {
            let cart = { product: [], totalPrice: 0 };
            if (!err) {
                cart = JSON.parse(fileContent);
                console.log(cart);
            }
            // Analyse the cart => Find existing product
            const existingProduct = cart.products.find(prod => prod.id === id);
            console.log(existingProduct);
            let updatedProduct;
            // Add new product/ increase quantity
            if (existingProduct) {
                // updatedProduct = {...existingProduct }
                // updatedProduct.qty = updatedProduct.qty + 1;
                existingProduct.qty = existingProduct.qty + 1;
            } else {
                updatedProduct = { id: id, qty: 1 };
                cart.products = [...cart.products, updatedProduct];
            }
            cart.totalPrice = cart.totalPrice + +productPrice;
            fs.writeFile(p, JSON.stringify(cart), (err) => {
                // console.log(err);
            });
        });
    }

    static deleteProduct(id, productPrice) {
        fs.readFile(p, (err, fileContent) => {
            if (err) {
                return;
            }
            const updatedCart = {...JSON.parse(fileContent) }
            const product = updatedCart.products.find(prod => prod.id === id);
            if (!product) {
                return;
            }
            const productQty = product.qty;
            updatedCart.products = updatedCart.products.filter(prod => prod.id !== id);
            updatedCart.totalPrice = updatedCart.totalPrice - productPrice * productQty;
            fs.writeFile(p, JSON.stringify(updatedCart), (err) => {
                console.log(err);
            });
        });
    }

    static getCart(cb) {
        fs.readFile(p, (err, fileContent) => {
            const cart = JSON.parse(fileContent)
            if (err) {
                cb(null);
            } else {
                cb(cart);
            }
        });
    }
}