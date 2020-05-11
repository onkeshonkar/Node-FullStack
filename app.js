const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");


const errorController = require("./controllers/error");
const User = require("./models/user");
const shopController = require('./controllers/shop');
const isAuth = require('./middleware/is-auth')

const MONGODB_URI =
    "mongodb+srv://onkesh_onkar:Onkesh1998@cluster0-s8dke.mongodb.net/shop";

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: "sessions",
});

const csrfProtection = csrf();


const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now().toString() + "-" + file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg"
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(
    session({
        secret: "my secret key",
        resave: false,
        saveUninitialized: false,
        store: store,
    })
);

app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    if (req.session.isLoggedIn) {
        res.locals.email = req.session.user.email;
    } else {
        res.locals.email = null;
    }

    next();
});

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then((user) => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch((err) => {
            next(new Error(err));
        });
});

app.post('/create-order', isAuth, shopController.postOrder);

app.use(csrfProtection);
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
    res.status(500).render("500", {
        pageTitle: "Error",
        path: "/500",
        isAuthenticated: req.session.isLoggedIn,
    });
});

mongoose
    .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => {
        console.log("connected");
        app.listen(3000);
    })
    .catch((err) => {
        console.log(err);
    });
