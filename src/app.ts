import express, {Request, Response} from 'express';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import userRouter from './routes/users';
import adminRouter from './routes/Admin';
import indexRouter from './routes/index';
import {db} from './config/index';
import vendorRouter from './routes/vendor'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()


//Sequelize connection
db.sync().then(()=>{
    console.log("Db connected successfully")
}).catch(err=>{
    console.log(err)
})

const app = express()

app.use(express.json());
app.use(logger('dev'));
app.use(cookieParser())
app.use(cors())

//Router middleware
app.use('/', indexRouter)
app.use('/users', userRouter)
app.use('/admins', adminRouter)
app.use('/vendors', vendorRouter)



const port = 3005
app.listen(port, ()=>{
    console.log(`Server running on http://localhost:${port}`)
})

export default app