const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const errorController = require('./controllers/error');
const User = require('./models/user');


const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    User.findById('5e9e9e8a84e56439dc4ae25b')
        .then(user => {
            // console.log(user);
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

mongoose
    .connect(
        'mongodb+srv://onkesh_onkar:Onkesh1998@cluster0-s8dke.mongodb.net/shop?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true }
    )
    .then(result => {
        User.findOne().then(user => {
            if (!user) {
                const user = new User({
                    name: "onkesh",
                    email: 'kumar@gmail.com',
                    cart: {
                        items: []
                    }
                });
                user.save();
            }
        });

        console.log('connected');
        app.listen(3000);
    })
    .catch(err => {
        console.log(err);
    });