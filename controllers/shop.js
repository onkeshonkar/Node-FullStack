const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
    Product.find()
        .then(products => {
            console.log(products);
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'All Products',
                path: '/products',
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            res.render('shop/product-detail', {
                product: product,
                pageTitle: product.title,
                path: '/products',
            });
        })
        .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
    Product.find()
        .then(products => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/',
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items;
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products,
            });
        })
        .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(result => {
            console.log(result);
            res.redirect('/cart');
        });
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user
        .removeFromCart(prodId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items.map(i => {
                return { quantity: i.quantity, product: {...i.productId._doc } };
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user
                },
                products: products
            });
            return order.save();
        })
        .then(result => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders: orders,
            });
        })
        .catch(err => console.log(err));
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
        .then(order => {
            if (!order) {
                return next(new Error('No order found!'));
            }
            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error('Unauthorized'));
            }
            const invoiceName = 'invoice-' + orderId + '.pdf';
            const invoicepath = path.join('data', 'invoices', invoiceName);

            const pdfDoc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
            pdfDoc.pipe(fs.createWriteStream(invoicepath));
            pdfDoc.pipe(res);

            pdfDoc
                .text("Your Invoice", 60, 57)
                .fontSize(10)
                .text(`Email: ${req.user.email}`, 200, 65, { align: "right" })
                .moveDown()
                .fontSize(10)
                .text(
                    " Thank you for your business.",
                    50,
                    700, { align: "center", width: 500 }
                );
            pdfDoc
                .fontSize(10)
                .text(`Item`, 60, 150)
                .text(`Description`, 170, 150)
                .text(`Unit Price`, 300, 150, { width: 70, align: "right" })
                .text(`Qty`, 370, 150, { width: 70, align: "right" })
                .text(`Total price`, 0, 150, { align: "right" })
                .strokeColor("#aaaaaa")
                .lineWidth(1)
                .moveTo(60, 170)
                .lineTo(570, 170)
                .stroke();

            let totalPrice = 0;
            order.products.forEach((prod, i) => {
                const y = 150 + (i + 1) * 30;
                const price = prod.quantity * prod.product.price;
                totalPrice += price;
                pdfDoc
                    .fontSize(10)
                    .text(`${prod.product.title}`, 60, y)
                    .text(`${prod.product.description}`, 170, y)
                    .text(`$ ${prod.product.price}`, 270, y, { width: 90, align: "right" })
                    .text(`${prod.quantity}`, 350, y, { width: 90, align: "right" })
                    .text(`$ ${price}`, 0, y, { align: "right" })
            })

            pdfDoc
                .moveDown(5)
                .fontSize(12)
                .text("Paid: $ " + totalPrice, { align: "right" })
                .end();
            // fs.readFile(invoicepath, (err, data) => {
            //     if (err) {
            //         return next(err);
            //     }
            //     res.setHeader('Content-Type', 'application/pdf');
            //     res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
            //     res.send(data);
            // })
            // const file = fs.createReadStream(invoicepath);
            // file.pipe(res);
        })
        .catch(err => next(err));

}