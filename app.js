const path            = require('path'),
      express         = require('express'),
      bodyParser      = require('body-parser'),
      session         = require('express-session'),
      MySQLStore      = require('express-mysql-session')(session),
      csrf            = require('csurf'),
      flash           = require('connect-flash'),
      multer          = require('multer'),
      app             = express();

const sequelize       = require('./util/database'),
      Product         = require('./models/product'),
      User            = require('./models/user'),
      Cart            = require('./models/cart'),
      CartItem        = require('./models/cart-item'),
      Order           = require('./models/order'),
      OrderItem       = require('./models/order-item');

const errorController = require('./controllers/error'),
      shopController  = require('./controllers/shop');

const isAuth = require('./middleware/isAuth');

var options = {
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: 'YOUR_MYSQL_PASSWORD',
	database: 'ShoppingCart',
};
const sessionStore    = new MySQLStore(options);

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes  = require('./routes/shop');
const authRoutes  = require('./routes/auth');

const csrfToken = csrf(); 

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname + '-' + new Date().toISOString()) ;
    }
});
const fileFilter = (req, file, cb) => {
    if( file.mimetype === 'image/png'  || 
        file.mimetype === 'image/jpeg' || 
        file.mimetype === 'image/jpg' ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

// process.on('unhandledRejection', up => { throw up }) to match unhandledPromiseRejection Warnings
app.use(bodyParser.urlencoded({ extended: false }));
app.use( 
    multer({ 
        storage: fileStorage,
        fileFilter: fileFilter
    })
    .single('image')
);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(session({ 
    secret: 'CatSAreTHECUte$T', 
    resave: false, 
    saveUninitialized: false,
    store: sessionStore
}));

app.use((req, res, next) => {
    if(!req.session.user) {
        return next();
    }
    User.findByPk(req.session.user.id)
    .then(user => {
        if(!user) {
            return next(); // continue without user if not found
        }
        req.user = user ;
        //console.log('Magic methods in scope', Object.keys(req.user.__proto__));
        next();
    })
    .catch(err => {
        next(new Error(err));
    });
});


app.use(flash());

app.post('/create-order', isAuth, shopController.postOrder);

app.use(csrfToken);
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use('/500', errorController.get500);
app.use(errorController.get404);
app.use((error, req, res, next) => {
    //res.redirect('/500');
    console.log(error);
    res.status(500).render('500', { 
        pageTitle: 'Error', 
        path: '/500',
        isAuthenticated: req.session.isLoggedIn 
    });
});

Product.belongsTo(User, {constraints: true, onDelete: 'CASCADE'})
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, { through: OrderItem });

sequelize
  //.sync({force: true}) // for modifying existing table not to use in prod
  .sync()
  .then(result => {
    app.listen(3000);
.catch(err => {
    console.log(err);
});
