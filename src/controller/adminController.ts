import express,{Request, Response} from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { adminSchema, GenerateOTP, GeneratePassword, GenerateSalt, GenerateSignature, option, vendorSchema } from '../utils'
import { UserInstance, UserAttributes } from '../model/userModel'; 
import {v4 as uuidv4} from 'uuid';
import { VendorAttributes, VendorInstance } from '../model/vendorModel';


/**==================== Register Admin ========================**/
export const AdminRegister = async(req:JwtPayload, res:Response) =>{
    try{

    const id = req.user.id
        const { email, phone, password,firstName, lastName, address} = req.body;
        const uuiduser = uuidv4()
    
        const validateResult = adminSchema.validate(req.body, option)
        if(validateResult.error){
            return res.status(400).json({
                Error:validateResult.error.details[0].message
            })
        }
    
    //Generate salt
    const salt = await GenerateSalt();
    const adminPassword = await GeneratePassword(password, salt)
    
    //Generate OTP
    const  {otp, expiry} = GenerateOTP();
    
    //Check if Admin exist
    const Admin = await UserInstance.findOne({where: {id:id}}) as unknown as UserAttributes;
    
    if(Admin.email === email){
        return res.status(400).json({
            message: "Email already exist"
        })
    }

    if(Admin.phone === phone){
        return res.status(400).json({
            message: "Phone Number already exist"
        })
    }

    //Create Admin
    if(Admin.role === "superadmin"){
      await UserInstance.create({
        id:uuiduser,
        email,
        password: adminPassword,
        firstName,
        lastName,
        salt,
        address,
        phone,
        otp,
        otp_expiry: expiry,
        lng: 0,
        lat: 0,
        verified: true,
        role: "admin"
    })
    
    
    //check if admin exist
    const Admin = await UserInstance.findOne({where: {id:id}}) as unknown as UserAttributes
    
    //Generate a signature
    let signature = await GenerateSignature({
        id:Admin.id,
        email:Admin.email,
        verified: Admin.verified,
    });
    
        return res.status(201).json({
            message:"Admin created successfully",
            signature,
             verified: Admin.verified,
             
    
        })
    }
    return res.status(400).json({
        message:"Admin already exist",
    })
    
    }catch(err){
        res.status(500).json({
            Error:"Internal server Error",
            route:"/admins/create-admin"
        })
    }
    };
    /**==================== Super-Admin ========================**/
    /**==================== RegisterAdmin ========================**/
   
    export const SuperAdmin = async(req:JwtPayload, res:Response) =>{
        try{
    
            const { email, phone, password,firstName, lastName, address} = req.body;
            const uuiduser = uuidv4()
        
            const validateResult = adminSchema.validate(req.body, option)
            if(validateResult.error){
                return res.status(400).json({
                    Error:validateResult.error.details[0].message
                })
            }
        
        //Generate salt
        const salt = await GenerateSalt();
        const adminPassword = await GeneratePassword(password, salt)
        
        //Generate OTP
        const  {otp, expiry} = GenerateOTP();
        
        //Check if Admin exist
        const Admin = await UserInstance.findOne({where: {email:email}}) as unknown as UserAttributes;
        
       
    
        //Create Admin
        if(!Admin){
          await UserInstance.create({
            id:uuiduser,
            email,
            password: adminPassword,
            firstName,
            lastName,
            salt,
            address,
            phone,
            otp,
            otp_expiry: expiry,
            lng: 0,
            lat: 0,
            verified: true,
            role: "superadmin"
        })
        
        
        //check if admin exist
        const Admin = await UserInstance.findOne({where: {email:email}}) as unknown as UserAttributes
        
        //Generate a signature
        let signature = await GenerateSignature({
            id:Admin.id,
            email:Admin.email,
            verified: Admin.verified,
        });
        
            return res.status(201).json({
                message:"Admin created successfully",
                signature,
                 verified: Admin.verified,
                 
        
            })
        }
        return res.status(400).json({
            message:"Admin already exist",
        })
        
        }catch(err){
            res.status(500).json({
                Error:"Internal server Error",
                route:"/admins/create-admin"
            })
        }
        };
        

        /**==================== Create Vendor ========================**/
        export const createVendor = async (req:JwtPayload, res:Response)=>{
            
            try{
                const id = req.user.id
                const {
                    name, restuarantName, pincode,phone,address,email,password,
                } = req.body;

         const uuidvendor = uuidv4()
         const validateResult = vendorSchema.validate(req.body, option)
            if(validateResult.error){
                return res.status(400).json({
                    Error:validateResult.error.details[0].message
                });
            }
            //Generate salt
        const salt = await GenerateSalt();
        const vendorPassword = await GeneratePassword(password, salt)
    
        //check if vendor exist
        const Vendor = await VendorInstance.findOne({where: {email:email}}) as unknown as VendorAttributes;
        //console.log('hello')
        
        const Admin = await UserInstance.findOne({where: {id:id}}) as unknown as UserAttributes

        if(Admin.role === 'admin' || Admin.role === 'superadmin'){

        

        if(!Vendor){
            const createVendor = await VendorInstance.create({
                id:uuidvendor,
                name, 
                restuarantName,
                pincode,
                phone,
                address,
                email,
                password:vendorPassword,
                salt,
                serviceAvailable:false,
                role:"vendor",
                rating:0,
                coverImage:"",

            })
            return res.status(201).json({
                message: "Vendor created successfully",
                createVendor
            });
        }
        return res.status(400).json({
            message: "Vendor already exist",
        });
    }
    return res.status(400).json({
        message: "unauthorised", 
});

            }catch(err){
                res.status(500).json({
                    Error:"Internal server Error",
                    route:"/admins/create-vendors"
                })
            }
        }