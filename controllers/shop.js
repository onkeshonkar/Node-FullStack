const fs = require("fs");
const path = require("path");

const PDFDocument = require("pdfkit");

const Product = require("../models/product");
const Order = require("../models/order");

const ITEM_PER_PAGE = 4;

const stripe = require("stripe")("sk_test_Pnjbrd07XwKUBXYMExhrE02n00fWrtYgFu");

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((prodNum) => {
      totalItems = prodNum;
      return Product.find()
        .skip((page - 1) * ITEM_PER_PAGE)
        .limit(ITEM_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "Products",
        path: "/products",
        currentPage: page,
        hasNextPage: ITEM_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEM_PER_PAGE),
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => console.log(err));
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((prodNum) => {
      totalItems = prodNum;
      return Product.find()
        .skip((page - 1) * ITEM_PER_PAGE)
        .limit(ITEM_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNextPage: ITEM_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEM_PER_PAGE),
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items;
      let total = 0;
      products.forEach((p) => {
        total += p.quantity * p.productId.price;
      });

      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your cart",
        products: products,
        totalSum: total,
      });
    })
    .catch((err) => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => console.log(err));
};

exports.getCheckout = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      if (user.cart.items.length > 0) {
        let totalSum = 0;
        user.cart.items.forEach((p) => {
          totalSum += p.quantity * p.productId.price;
        });
        return res.render("shop/checkout", {
          path: "/checkout",
          pageTitle: "Checkout",
          totalSum: totalSum,
        });
      }
      res.redirect("/");
    })
    .catch((err) => console.log(err));
};

exports.postOrder = (req, res, next) => {
  let intent;
  let order;
  let totalSum = 0;
  const generateResponse = (intent) => {
    // Note that if your API version is before 2019-02-11, 'requires_action'
    // appears as 'requires_source_action'.
    if (
      intent.status === "requires_action" &&
      intent.next_action.type === "use_stripe_sdk"
    ) {
      // Tell the client to handle the action
      return {
        requires_action: true,
        payment_intent_client_secret: intent.client_secret,
      };
    } else if (intent.status === "succeeded") {
      // The payment didn’t need any additional actions and completed!
      // Handle post-payment fulfillment
      return {
        success: true,
        id: intent.id,
      };
    } else {
      // Invalid status
      return {
        // error: 'Invalid PaymentIntent status'
        error: intent.message,
        code: intent.code,
        decline_code: intent.decline_code,
      };
    }
  };
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      user.cart.items.forEach((p) => {
        totalSum += p.quantity * p.productId.price;
      });

      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });

      order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      // console.log(totalSum);

      if (req.body.payment_method_id) {
        // Create the PaymentIntent
        return stripe.paymentIntents.create({
          payment_method: req.body.payment_method_id,
          amount: totalSum * 100,
          currency: "inr",
          confirmation_method: "manual",
          confirm: true,
          metadata: {
            order_id: req.body.payment_method_id,
            user: req.user.email,
          },
        });
      } else if (req.body.payment_intent_id) {
        return stripe.paymentIntents.confirm(req.body.payment_intent_id);
      }
    })
    .then((intnt) => {
      // console.log(intnt);
      intent = intnt;
      if (intent.status === "succeeded") {
        return order.save();
      }
      return;
    })
    .then((result) => {
      if (intent.status === "succeeded") {
        return req.user.clearCart();
      }
      return;
    })
    .then(() => {
      res.send(generateResponse(intent));
    })
    .catch((err) => {
      // console.log(err);
      // res.send({error:err})
      res.send(generateResponse(err));
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => console.log(err));
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No order found!"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicepath = path.join("data", "invoices", invoiceName);

      const pdfDoc = new PDFDocument({ margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + invoiceName + '"'
      );
      pdfDoc.pipe(fs.createWriteStream(invoicepath));
      pdfDoc.pipe(res);

      pdfDoc
        .text("Your Invoice", 60, 57)
        .fontSize(10)
        .text(`Email: ${req.user.email}`, 200, 65, { align: "right" })
        .moveDown()
        .fontSize(10)
        .text(" Thank you for your business.", 50, 700, {
          align: "center",
          width: 500,
        });
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
        const y = 150 + (i + 1) * 70;
        const price = prod.quantity * prod.product.price;
        totalPrice += price;
        pdfDoc
          .fontSize(10)
          .text(`${prod.product.title}`, 60, y, {
            width: 90,
            align: "right",
          })
          .text(`${prod.product.description}`, 170, y, {
            width: 90,
            align: "right",
            height: prod.product.description.length / 18,
            lineBreak: true,
          })
          .text(`$ ${prod.product.price}`, 270, y, {
            width: 90,
            align: "right",
          })
          .text(`${prod.quantity}`, 350, y, { width: 90, align: "right" })
          .text(`$ ${price}`, 0, y, { align: "right" });
      });

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
    .catch((err) => next(err));
};
