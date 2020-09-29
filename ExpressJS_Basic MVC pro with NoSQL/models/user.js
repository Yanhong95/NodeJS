const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;

const ObjectId = mongodb.ObjectId;

class User {
  constructor(username, email, cart, id) {
    this.name = username;
    this.email = email;
    this.cart = cart; // {items: []}
    this._id = id;
  }

  save() {
    const db = getDb();
    return db.collection('users').insertOne(this);
  }

  addToCart(product) {
    console.log(product);
    const cartProductIndex = this.cart.items.findIndex(item => item.productId.toString() === product._id.toString());
    const updatedCartItems = [...this.cart.items];
    if (cartProductIndex >= 0) {
      const newQuantity = this.cart.items[cartProductIndex].quantity + 1;
      updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
      updatedCartItems.push({
        productId: new ObjectId(product._id),
        quantity: 1
      })
    }
    const updatedCart = {
      items: updatedCartItems
    };
    const db = getDb();
    return db.collection('users')
      .updateOne(
        { _id: new ObjectId(this._id) },
        { $set: { cart: updatedCart } });
  }

  async getCart() {
    const db = getDb();

    const productIds = this.cart.items.map(item => item.productId);

    // ...........如果admin删除某产品, 将该产品也在用户的购物车里删掉.
    const originProducts = await db.collection('products').find().toArray();
    const originProductsIndexes = originProducts.map(product => product._id.toString())
    const updatedCartItems = this.cart.items.filter(item => originProductsIndexes.includes(item.productId.toString()));
    if(updatedCartItems.length != this.cart.items.length){
      await db.collection('users').updateOne(
        { _id: new ObjectId(this._id) },
        { $set: { cart: { items: updatedCartItems } } });
    }
    // ...........

    return db.collection('products').find({ _id: { $in: productIds } }).toArray()
      .then(products => products.map(porduct => {
        return {
          ...porduct,
          quantity: this.cart.items.find(item => item.productId.toString() === porduct._id.toString()).quantity
        }
      }));
  }

  deleteItemFromCart(porductid) {
    const db = getDb();
    const updatedCartItems = this.cart.items.filter(item => item.productId.toString() !== porductid);
    return db.collection('users').updateOne(
      { _id: new ObjectId(this._id) },
      { $set: { cart: { items: updatedCartItems } } }
    );
  }


  addOrder() {
    const db = getDb();
    return this.getCart().then(porducts => {
      const order = {
        items: porducts,
        user: { _id: new ObjectId(this._id), name: this.name }
      }
      return db.collection('orders').insertOne(order);
    }).then(result => {
      this.cart = { items: [] };
      return db.collection('users').updateOne(
        { _id: new ObjectId(this._id) },
        { $set: { cart: { items: [] } } }
      );
    })
  }

  getOrders() {
    const db = getDb();
    return db
      .collection('orders')
      .find({ 'user._id': new ObjectId(this._id) })
      .toArray();
  }

  static findById(userId) {
    const db = getDb();
    return db
      .collection('users')
      .findOne({ _id: new ObjectId(userId) })
      .then(user => {
        console.log(user);
        return user;
      })
      .catch(err => {
        console.log(err);
      });
  }

}

module.exports = User