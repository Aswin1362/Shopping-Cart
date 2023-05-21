var db = require('../config/connection');
var collections = require('../config/collections');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const Razorpay = require('razorpay');
var instance = new Razorpay({
    key_id: 'rzp_test_c62TZSFnN40zXI',
    key_secret: 'QJ2VtX99CI9FsE9fvOt6JM2y',
});

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10);
            db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.insertedId);
                console.log(data);
            })
        })
    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {};
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ Email: userData.Email });
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((result) => {
                    if (result) {
                        console.log('login success!!');
                        response.result = true;
                        response.user = user;
                        resolve(response);
                    } else {
                        console.log('login failed :((');
                        resolve({ result: false });
                    }
                });
            } else {
                console.log('Login Failed!!... :((');
                resolve({ result: false });
            }
        });
    },

    addToCart: (proId, userId) => {
        let proObj = {
            item: new ObjectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: new ObjectId(userId) });
            if (userCart) {
                let proExist = userCart.products.findIndex(products => products.item == proId)
                console.log(proExist)
                if (proExist != -1) {
                    db.get().collection(collections.CART_COLLECTION).updateOne({ user: new ObjectId(userId), 'products.item': new ObjectId(proId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve()
                        })
                } else {
                    db.get().collection(collections.CART_COLLECTION).updateOne({ user: new ObjectId(userId) },
                        {
                            $push: { products: proObj }
                        }
                    ).then((response) => {
                        resolve(response);
                    })
                }
            } else {
                let cartObj = {
                    user: new ObjectId(userId),
                    products: [proObj]
                }
                db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve(response);
                })
            }
        })
    },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match: { user: new ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] }
                    }
                }
            ]).toArray()
            console.log(cartItems)
            resolve(cartItems)
        })
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0;
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count);
        })
    },

    changeProductQuantity: ((details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        // console.log(details)

        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {

                db.get().collection(collections.CART_COLLECTION).updateOne({ _id: new ObjectId(details.cart) },
                    {
                        $pull: { products: { item: new ObjectId(details.product) } }

                    }).then((response) => {

                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collections.CART_COLLECTION).updateOne({ _id: new ObjectId(details.cart), 'products.item': new ObjectId(details.product) },
                    {
                        $inc: { 'products.$.quantity': details.count }

                    }).then((response) => {
                        resolve({ status: true })
                    })
            }
        })
    }),

    RemoveProducts: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CART_COLLECTION).updateOne({ _id: new ObjectId(details.cart) },
                {
                    $pull: { products: { item: new ObjectId(details.product) } },
                }
            )
                .then((response) => {
                    resolve({ removeProduct: true });
                });
        });
    },

    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match: { user: new ObjectId(userId) }
                },
                {
                    '$unwind': '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$products.Price' }] } }
                    }
                }
            ]).toArray()
            if (total[0]) {
                resolve(total[0].total);
            } else {
                resolve([]);
            }
        })
    },

    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            console.log(order, products, total);
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    mobile: order.mobile,
                    address: order.address,
                    pincode: order.pincode,

                },
                userId: new ObjectId(order.userId),
                paymentMethod: order['payment-method'],
                totalAmount: total,
                products: products,
                status: status,
                date: new Date()
            }

            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collections.CART_COLLECTION).deleteOne({ user: new ObjectId(order.userId) })
                console.log(response.insertedId);
                resolve(response.insertedId)
            })
        })
    },

    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log(userId)
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
            console.log(cart)
            resolve(cart.products)
        })
    },

    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collections.ORDER_COLLECTION).find({ userId: new ObjectId(userId) }).toArray()
            console.log(orders);
            resolve(orders)
        })
    },

    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: new ObjectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] }
                    }
                }
            ]).toArray()
            console.log(orderItems)
            resolve(orderItems)
        })
    },

    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("New Order :", order);
                    resolve(order);
                }
            });
        })
    },

    verifyPayment: (details) => {
        return new Promise(async (resolve, reject) => {
            const {
                createHmac,
            } = await import('node:crypto');
            let hmac = createHmac('sha256', 'QJ2VtX99CI9FsE9fvOt6JM2y');
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex');
            if(hmac==details['payment[razorpay_signature]']){
                resolve();
            }else{
                reject();
            }
        })
    },

    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:new ObjectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }).then(()=>{
                resolve();
            })
        })
    }
}