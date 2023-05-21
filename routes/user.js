var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
var userHelper = require('../helpers/user-helpers');
const verifyLogin = (req,res,next)=>{
  if(req.session.loggedIn){
    next();
  }else{
    res.redirect('/login');
  }
}

/* GET home page. */
router.get('/',async function (req, res, next) {

  let user = req.session.user;
  // console.log(user);
  let cartCount = null
  if(req.session.user){
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  productHelper.getAllProducts().then((products)=>{

    res.render("user/view-products",{products, user,cartCount});
  })
});

router.get('/login',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect('/');
  }else{
    res.render('user/login',{'LoginErr':req.session.logginErr});
    req.session.loggedIn = false;
  }
})

router.get('/signup',(req,res)=>{

  res.render('user/signup');
})

router.post('/signup',(req,res)=>{
  userHelper.doSignup(req.body).then((data)=>{
    console.log(data);
    req.session.loggedIn = true;
    req.session.user = data;
    res.redirect('/');
  })
})

router.post('/login',(req,res)=>{
  userHelper.doLogin(req.body).then((data)=>{
    if(data.result){
      req.session.loggedIn = true;
      req.session.user = data.user;
      res.redirect('/');
    }else{
      req.session.logginErr = true;
      res.redirect('/login');
    }
  })
})

router.get('/logout', function(req, res) {
  req.session.destroy(function(err){
     if(err){
        console.log(err);
     }else{
         res.redirect('/login');
     }
  });

});

router.get('/cart',verifyLogin,async(req,res)=>{
  let product = await userHelpers.getCartProducts(req.session.user._id)
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  console.log(product)
  res.render('user/cart',{product,user:req.session.user._id,totalValue});
});

router.get('/add-to-cart/:id',(req,res)=>{
  console.log('api call')
  userHelpers.addToCart(req.params.id,req.session.user._id).then((response)=>{
    res.json({status:true});
    // console.log(response)
  })
});

router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body)
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
});

router.post('/remove-product',(req,res,next)=>{
  console.log(req.body)
  userHelpers.RemoveProducts(req.body).then((response)=>{
    res.json(response)
  })
});

router.get('/place-order',verifyLogin,async(req,res)=>{
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
});

router.post('/place-order',async(req,res)=>{
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if(req.body['payament-method']=='COD'){
    res.json({codSuccess:true})
    }else{
      userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
        res.json(response);
      })
    }
  })
  console.log(req.body);
})

router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:req.session.user});
});

router.get('/orders',async(req,res)=>{
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders})
});

router.get('/view-order-products/:id',async(req,res)=>{
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products',{user:req.session.user,products})
});

router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log('Payment Successfull');
      res.json({status:true});
    })
  }).catch((err)=>{
    console.log(err);
    res.json({status:false,errMsg:''});
  })
})

module.exports = router;
