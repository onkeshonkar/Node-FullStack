const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const errorController = require('./controllers/error');
const sequelize = require('./util/database');
const Product = require('./models/product');
const User = require('./models/user');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order = require('./models/order')
const OrderItem = require('./models/order-item')


const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    User.findOne({ where: { id: 1 } })
        .then(user => {
            req.user = user;
            next();
        })
        .catch(err => {
            console.log(err);
        });
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

Product.belongsTo(User, { constraints: true, onDelete: 'CASCADE ' });
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, { through: OrderItem });


sequelize
// .sync({ force: true })
    .sync()
    .then(result => {
        return User.findOne({ where: { id: 1 } });
        // console.log(result);
    })
    .then((user) => {
        if (!user) {
            return User.create({ name: 'Onkesh', email: 'test@gmail.com' });
        }
        return user;
    })
    .then(user => {
        // console.log(user);
        if (!user) {
            return user.createCart();
        }
        return user.getCart();
    })
    .then(cart => {
        // console.log(cart);
        app.listen(3000);
    })
    .catch(err => {
        console.log(err);
    });