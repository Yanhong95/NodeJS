const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;

class Product {
  constructor(title, price, description, imageUrl, id, userId) {
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
    this._id = id ? new mongodb.ObjectId(id) : null;
    this.userId = userId;
  }

  save() {
    const db = getDb();
    let dbOp;
    if (this._id) {
      // Update the product
      dbOp = db
        .collection('products')
        .updateOne({ _id: this._id }, { $set: this });
    } else {
      dbOp = db.collection('products').insertOne(this);
    }
    return dbOp
      .then(result => {
        console.log(result);
      })
      .catch(err => {
        console.log(err);
      });
  }

  static fetchAll() {
    const db = getDb();
    return db
      .collection('products')
      .find()
      .toArray()
      .then(products => {
        console.log(products);
        return products;
      })
      .catch(err => {
        console.log(err);
      });
  }

  static findById(prodId) {
    const db = getDb();
    return db
      .collection('products')
      // find() return the cursor, the cursor is automatically iterated to access up to the first 20 documents that match the query. 
      // To manually iterate over the results, using the next() Method.
      .findOne({ _id: new mongodb.ObjectId(prodId) })
      .then(product => {
        console.log(product);
        return product;
      })
      .catch(err => {
        console.log(err);
      });
  }

  static findByIdThenUpdate(prodId, updatedTitle, updatedPrice, updatedDesc, updatedImageUrl) {
    const db = getDb();
    return db.collection('products')
      .findOneAndUpdate(
        { _id: new mongodb.ObjectId(prodId) },
        { $set: { title: updatedTitle, price: updatedPrice, description: updatedDesc, imageUrl: updatedImageUrl } }
      )
      .then(product => {
        console.log(product);
        return product;
      })
      .catch(err => {
        console.log(err);
      });
  }

  static deleteById(prodId){
    const db = getDb();
    return db.collection('products')
      .deleteOne({_id : new mongodb.ObjectId(prodId)})
      .then(result => console.log('Deleted!'))
      .catch(err => {
        console.log(err);
      });
  }
}

module.exports = Product;
