var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers');

/* GET users listing. */
router.get('/', function(req, res, next) {

  productHelper.getAllProducts().then((products)=>{

    // console.log(products);
    res.render("admin/view-products",{admin:true,products});
  })
});

router.get('/add-products',function(req,res){
  res.render('admin/add-products');
});

router.post('/add-products',(req,res)=>{
  // console.log(req.body);
  // console.log(req.files.Image);
  
  productHelper.addProduct(req.body,(Id)=>{
    let image = req.files.Image;
    // console.log(Id)
    image.mv('./public/images/'+Id+'.jpg',(err,done)=>{
      if(!err){
        res.render('admin/add-products');
      }else{
        console.log(err)
      }
    })
  })
});

router.get('/delete-products/:id',function(req,res){
  let productid = req.params.id;
  // console.log(proId);
  productHelper.deleteProduct(productid).then((response)=>{
    // console.log(response);
    res.redirect('/admin/');
  })
});

router.get('/edit-products/:id',async(req,res)=>{
  let product =  await productHelper.getProductDetails(req.params.id);
  // console.log(product);
  res.render('admin/edit-products',{product});
});

router.post('/edit-products/:id',(req,res)=>{
  productHelper.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let image = req.files.Image;
      image.mv('./public/images/'+req.params.id+'.jpg')
    }
  })
})
module.exports = router;
