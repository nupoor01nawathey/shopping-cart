const path            = require('path'),
      express         = require('express'),
      bodyParser      = require('body-parser'),
      session         = require('express-session'),
      MySQLStore      = require('express-mysql-session')(session),
      app             = express();

const sequelize       = require('./util/database'),
      Product         = require('./models/product'),
      User            = require('./models/user'),
      Cart            = require('./models/cart'),
      CartItem        = require('./models/cart-item'),
      Order           = require('./models/order'),
      OrderItem       = require('./models/order-item');

const errorController = require('./controllers/error');

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

// process.on('unhandledRejection', up => { throw up }) to match unhandledPromiseRejection Warnings
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ 
    secret: 'CatSAreTHECUte$T', 
    resave: false, 
    saveUninitialized: false,
    store: sessionStore
}));

app.use((req, res, next) => {
    User.findById(1)
    .then(user => {
        req.user = user;
        // console.log('Magic methods in scope', Object.keys(req.user.__proto__));
        next();
    })
    .catch(err => {
        console.log(err);
    });
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

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
// .sync({force: true}) // for modifying existing table not to use in prod
  .sync()
  .then(result => {
    return User.findByPk(1);
  }).then(user => {
    if(!user) {
        return User.create({ name: 'Nupoor', email: 'test@test.com' });
    }
    return user;
})
.then(user => {
    return user.createCart();
})
.then(cart => {
    app.listen(3000);
})
.catch(err => {
    console.log(err);
});

