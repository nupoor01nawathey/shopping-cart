const express    = require('express'),
      path       = require('path'),
      bodyParser = require('body-parser');

const app = express();

const adminRoutes = require('./routes/admin'),
      shopRoutes  = require('./routes/shop');

const errorController = require('./controllers/error');

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use('/admin', adminRoutes);
app.use(shopRoutes);


app.use(errorController.notFound);

app.listen(3000);
