'use strict';

const fs              = require('fs'),
      https           = require('https'),
      path            = require('path'),
      express         = require('express'),
      bodyParser      = require('body-parser'),
      session         = require('express-session'),
      MySQLStore      = require('express-mysql-session')(session),
      csrf            = require('csurf'),
      flash           = require('connect-flash'),
      multer          = require('multer'),
      helmet          = require('helmet'),
      compression     = require('compression'),
      morgan          = require('morgan'),
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

// required for mysql session store
var options = {
	host: 'localhost',
	port: 3306,
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD,
	database: process.env.MYSQL_DB,
};
const sessionStore    = new MySQLStore(options);

// ejs template engine
app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes  = require('./routes/shop');
const authRoutes  = require('./routes/auth');

const csrfToken = csrf(); 

// required for https setup
const privateKey = fs.readFileSync('server.key'),
      publicCert = fs.readFileSync('server.cert');

// multer config for file store location and filename
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname + '-' + new Date().toISOString()) ;
    }
});
// multer config for filetype 
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
app.use(helmet());
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(session({ 
    secret: process.env.SESSION_SECRET, 
    resave: false, 
    saveUninitialized: false,
    store: sessionStore
}));

// identify loggedin user using session
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

// use morgan setup for logging
let accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

// sequelize relations between product,order and user
Product.belongsTo(User, {constraints: true, onDelete: 'CASCADE'})
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, { through: OrderItem });

// app server config
const PORT = process.env.PORT || 3000 ;
sequelize
  //.sync({force: true}) // for modifying existing table not to use in prod
  .sync()
  .then(result => {
    // https.createServer({key: privateKey, cert: publicCert}, app).listen(PORT);
    app.listen(PORT, () => {
        console.log('server started at port ', PORT);
    });
  })
.catch(err => {
    console.log(err);
});

// openssl req -nodes -new -x509 -keyout server.key -out server.cert
