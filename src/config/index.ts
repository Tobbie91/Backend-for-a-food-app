import {Sequelize} from 'sequelize';
import dotenv from 'dotenv'
dotenv.config()

export const db = new Sequelize('app', '', '',{
    storage:"./food.sqlite",
    dialect:"sqlite",
    logging:false
})

export const AccountSid = process.env.AccountSID;
export const AuthToken = process.env.AuthToken
export const fromAdminPhone = process.env.fromAdminPhone
export const Gmail_User=process.env.Gmail_User
export const Gmail_Pass=process.env.Gmail_Pass
export const FromAdminMail=process.env.FromAdminMail as string
export const userSubject=process.env.userSubject as string
export const APP_SECRET=process.env.APP_SECRET!