const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Products',
        path: '/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = async (req, res, next) => {
  try{
    const page = +req.query.page || 1;
    const totalItems = await Product.find().countDocuments()
    const products = await Product.find().skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE);
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/',
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
    });
  }catch(err){
    console.log(err);
  }
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => console.log(err));
};

// // 直接获取server文件地址然后传输
// exports.getInvoice = (req, res, next) => {
//   // 得到 orderId
//   const orderId = req.params.orderId;
//   Order.findById(orderId)
//     .then(order => {
//       if (!order) {
//         return next(new Error('No order found.'));
//       }
//       if (order.user.userId.toString() !== req.user._id.toString()) {
//         return next(new Error('Unauthorized'));
//       }
//       // 验证完订单存在且是当前用户的订单后, 我们组装invoice.pdf 文件名
//       const invoiceName = 'invoice-' + orderId + '.pdf';
//       // 在对应文件夹寻找这个文件. 
//       const invoicePath = path.join('data', 'invoices', invoiceName);
//       // 得到文件路径, 传输文件给前端下载.
//       fs.readFile(invoicePath, (err, data) => {
//         if (err) {
//           return next(err);
//         }
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader(
//           'Content-Disposition',
//           'inline; filename="' + invoiceName + '"'
//         );
//         res.send(data);
//       });
//     })
//     .catch(err => next(err));
// };




// // 用bufferStreaming 的方式.
// exports.getInvoice = (req, res, next) => {
//   // 得到 orderId
//   const orderId = req.params.orderId;
//   Order.findById(orderId)
//     .then(order => {
//       if (!order) {
//         return next(new Error('No order found.'));
//       }
//       if (order.user.userId.toString() !== req.user._id.toString()) {
//         return next(new Error('Unauthorized'));
//       }
//       // 验证完订单存在且是当前用户的订单后, 我们组装invoice.pdf 文件名
//       const invoiceName = 'invoice-' + orderId + '.pdf';
//       // 在对应文件夹寻找这个文件. 
//       const invoicePath = path.join('data', 'invoices', invoiceName);
//       // 得到文件路径, 传输文件给前端下载.
//       const file = fs.createReadStream(invoicePath);
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
//       file.pipe(res);
//     })
//     .catch(err => next(err));
// };


// 生成pdf的方式
exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then(order => {
      if (!order) {
        return next(new Error('No order found.'));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized'));
      }
      // 验证完订单存在且是当前用户的订单后, 我们组装invoice.pdf 文件名
      const invoiceName = 'invoice-' + orderId + '.pdf';
      // 指定文件路径. 
      const invoicePath = path.join('data', 'invoices', invoiceName);
		
      // 构建PDFDocument对象.
      const pdfDoc = new PDFDocument();
      // 填充res header, 告诉浏览器文件类型和文件名
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
      // pdfDoc是writeable strem. 告诉他stream类型和文件名
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      // 设置pdf文件格式
      pdfDoc.fontSize(26).text('Invoice', {underline: true});
      // 逐行写pdf内容
      pdfDoc.text('-----------------------');
      let totalPrice = 0;
      order.products.forEach(prod => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc.fontSize(14).text(prod.product.title +' - '+ prod.quantity +' x ' +'$' + prod.product.price);
      });
      pdfDoc.text('---');
      pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);
			// pdf写入结束. 存储pdf并发送给res.
      pdfDoc.end();
    })
    .catch(err => next(err));
};