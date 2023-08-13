const express = require('express')
const app = express()
const errorMiddleware = require("./middleware/error")
const cookieParser = require("cookie-parser")



app.use(express.json())
app.use(cookieParser())
// route imports
const product = require('./routes/productRoute')
const user = require('./routes/userRoute')
const order = require('./routes/orderRoute')


app.use('/home', product)
app.use('/user', user)
app.use('/order',order)



// Middleware for errors
app.use(errorMiddleware)


module.exports = app