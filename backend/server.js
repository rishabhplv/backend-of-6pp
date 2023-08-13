const app = require('./app')
const dotenv = require('dotenv')
const connectDatabase = require('./config/database')
const mongoose = require('mongoose')

// Handling Uncaught Exception
process.on("uncaughtException",(err)=>{
    console.log(`Error: ${err.message}`)
    console.log(`Shutting down the server due to Uncaught Exception`)
    process.close(()=>{
        process.exit(1)
    })
})

// config
dotenv.config({path:"backend/config/config.env"})

// connection to database
connectDatabase()




app.listen(process.env.PORT, ()=>{
    console.log(`server is working on http://localhost:${process.env.PORT}`)
}) 



// Unhandled Promise Rejection

process.on("unhandledRejection",err=>{
    console.log(`Error: ${err.message}`)
    console.log(`Shutting down the server due to Unhandled Rejection`)

    Server.close(()=>{
        process.exit(1)
    })
})