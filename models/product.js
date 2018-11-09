const db = require('../util/database');

module.exports = class Product {
  constructor(title, imageUrl, description, price) {
    this.title = title;
    this.imageUrl = imageUrl;
    this.description = description;
    this.price = price;
  }

  save() {
    return db.execute(
      'INSERT INTO products(title, imageUrl, description, price) VALUES(?, ?, ?, ?)',
      [this.title, this.imageUrl, this.description, this.price]
    );
  }

  static fetchAll() {
      return db.query('SELECT * FROM products');
  }

  static findById(id) {
    return db.execute(
      'SELECT * FROM products where idproducts = ?',
      [id]
    )
  }
};
