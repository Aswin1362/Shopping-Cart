# Shopping-Cart with Node.js

---
## Requirements

For development, you will only need Node.js and Mongodb(database to store data), installed in your system environement.

### Node
- #### Node installation on Windows

  Just go on [official Node.js website](https://nodejs.org/) and download the installer.
  
If the installation was successful, you should be able to run the following command.

    $ node --version
    v18.14.0

    $ npm --version
    9.3.1
    
### Starting with modules
- #### To get working on the project 

  Before that we should setup some dependencies:
  
  Try out these dependencies to install:-
 - ### express-handlebars
    `$ express --hbs`
 - ### npm all dependencies
    `npm install`
 - ### To auto-start the server after editing in code, try out nodemon dependency
    `npm i nodemon`
 - ### Defining express in app's render engine
    ```
    var express = require('express');
    var app = express();
    ```
    This will automatically listen at port 3000 when nodemon initialises.

## Response methods

```
res.json()

res.render() - render() function is used to render a view and sends the rendered HTML string to the client.

res.redirect() - Redirects the user to the specified route by forcing another request to an extrernal site or within the app
```

## View Engine setup

Here we use express-handlebars to view dynamic html pages.

`app.set` allows us to configure app settings - we are gonna configure the view engine setting, so the app knows which view engine to use ie handlebars.

```
app.set("view engine", "hbs")
```

Express-handlebars are used here since express alone is not having handlebar as its libraray we use them in app's render engine.

```
import {engine} from "express-handlebars"

app.engine("hbs", hbs.engine());
```

Since we use the `layouts` and `partials` so the view engine setup looks like this:

```
app.set('views', path.join(__dirname, 'views')) - default

app.engine('hbs',hbs.engine({layoutsDir: __dirname+"/views/layout"})); - For layouts

app.engine('hbs',hbs.engine({partialsDir: __dirname+"/views/partials/"})); - For partials
```

Now to render an hbs file we use `res.render()` and automatically the hbs express-handlebars will look `views` folder.

## 


