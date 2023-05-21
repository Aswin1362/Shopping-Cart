var db = require('../config/connection');
var collections = require('../config/collections');
const {ObjectId} = require('mongodb');
module.exports={
    
    addProduct:(products,callback)=>{
        console.log(products);

        db.get().collection('product').insertOne(products).then((data)=>{
            callback(data.insertedId);
        })
    },

    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray();
            resolve(products);
        })
    },

    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({_id:new ObjectId(prodId)}).then((response)=>{
                // console.log(response);
                resolve(response);
            });
        });
    },

    getProductDetails:(productId)=>{
        return new Promise((resolve,reject)=>{
            // console.log(productId)
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:new ObjectId(productId)}).then((product)=>{
                // console.log(product)
                resolve(product);
            });
        });
    },

    updateProduct:(productId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).updateOne({_id:new ObjectId(productId)},{
                $set:{
                    Name:proDetails.Name,
                    Description:proDetails.Description,
                    Price:proDetails.Price,
                    Category:proDetails.Category
                }
            }).then((response)=>{
                resolve(response);
            })
        })
    }
}