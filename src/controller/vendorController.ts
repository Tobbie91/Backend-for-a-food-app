import  { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { FoodAttributes, FoodInstance } from '../model/foodModel';
import { VendorAttributes, VendorInstance } from '../model/vendorModel';
import { GenerateSignature, loginSchema, option, updateVendorSchema, validatePassword } from '../utils';
import { v4 as uuidV4 } from 'uuid';

/**==================== Vendor Login ========================**/
export const vendorLogin = async (req: Request, res: Response) => {
    try {
        const { email, password, } = req.body;
        const validateResult = loginSchema.validate(req.body, option);

        if (validateResult.error) {
            return res.status(400).json({
                Error: validateResult.error.details[0].message,
            });
        }


        //check if vendor exist
        const Vendor = await VendorInstance.findOne({ where: { email: email } }) as unknown as VendorAttributes;
        console.log(Vendor)

        if (Vendor) {
            const validation = await validatePassword(password, Vendor.password, Vendor.salt)
            if (validation) {
                //Generate a signature for vendor
                let signature = await GenerateSignature({
                    id: Vendor.id,
                    email: Vendor.email,
                    serviceAvailable: Vendor.serviceAvailable
                });

                return res.status(200).json({
                    message: "You have successfully logged in",
                    signature,
                    email: Vendor.email,
                    serviceAvailable: Vendor.serviceAvailable,
                    role: Vendor.role
                });

            }
        }
        return res.status(400).json({
            Error: "Wrong Username or password or not verified"
        })
    } catch (err) {
        return res.status(500).json({
            Error: "Internal server Error",
            route: "/vendors/login"
        });
    }
}

/**==================== Vendor Add Food========================**/

export const createFood = async (req: JwtPayload, res: Response) => {
    try {
        const id = req.vendor.id;
        const { name,
            description,
            category,
            foodType,
            readyTime, 
            image,
            price } = req.body;

        //check if vendor exist
        const Vendor = await VendorInstance.findOne({ where: { id: id } }) as unknown as VendorAttributes;
        const foodid = uuidV4();
        if (Vendor) {
            const createFood = await FoodInstance.create({
                id: foodid,
                name,
                description,
                category,
                foodType,
                readyTime,
                price,
                rating: 0,
                image:req.file.path,
                vendorId: id
            }) as unknown as FoodAttributes;
            return res.status(201).json({
                message: "Food added successfully",
                createFood
            });
        }
        return res.status(400).json({
            Error: "Vendor does not exist"
        })

    } catch (err) {
        res.status(500).json({
            Error: "Internal server Error",
            route: "/vendors/create-food"
        });
    }
}

// /**==================== Get Vendor Profile ========================**/
export const vendorProfile = async (req: JwtPayload, res: Response) => {
    try {

        const id = req.vendor.id;

        //check if vendor exist
        const Vendor = (await VendorInstance.findOne({
            where: { id: id },
            attributes: ["id", "email", "name", "ownerName", "address", "phone", "serviceAvailable", "rating"],
            include: [
                {
                    model: FoodInstance,
                    as: 'food',
                    attributes: [
                        "id", "name", "description", "category", "foodType", "readyTime", "price", "rating", "vendorId"]
                },
            ],
        })) as unknown as VendorAttributes;
        return res.status(200).json({
            Vendor
        })

    } catch (err) {
        res.status(500).json({
            Error: "Internal server Error",
            route: "/vendors/get-profile"
        });
    }
}

// /**==================== Get All Vendor  ========================**/
export const GetAllVendors = async (req: JwtPayload, res: Response) => {
    try {

        //check if vendor exist
        const Vendor = (await VendorInstance.findAndCountAll())  
        return res.status(200).json({
            Vendor: Vendor.rows,
        })

    } catch (err) {
        res.status(500).json({
            Error: "Internal server Error",
            route: "/vendors/get-profile"
        });
    }
}

// /**====================  Vendor Delete Food ========================**/

export const deleteFood = async (req: JwtPayload, res: Response) => {
    try {
        const id = req.vendor.id;
        const foodid = req.params.foodid;

        //check if vendor exist
        const Vendor = await VendorInstance.findOne({ where: { id: id } }) as unknown as VendorAttributes;

        if (Vendor) {
            const deleteFood = await FoodInstance.destroy({ where: { id: foodid } });
            
            return res.status(200).json({
                message: "You have successfully deleted food",
                deleteFood,
            })

        }

    }catch (err) {
            res.status(500).json({
                Error: "Internal server Error",
                route: "/vendors/get-profile"
            })
        }
    }   

    // /**====================  Update Vendor Profile ========================**/
    export const updateVendorProfile = async(req:JwtPayload, res:Response)=>{
        try{
            const id = req.vendor.id
            const {name, coverImage, address, phone }= req.body;
    
            //joi validation
            const validateResult = updateVendorSchema.validate(req.body, option);
            if(validateResult.error){
                return res.status(400).json({
                    Error:validateResult.error.details[0].message,
                });
            }
    
          //check if vendor is registered 
          const Vendor = (await VendorInstance.findOne({where: {id:id}})) as unknown as VendorAttributes; 
            if(!Vendor){
                return res.status(400).json({
                Error: "You are not authorized to update your profile"
            });
        }
        const updatedVendor = (await VendorInstance.update(
            {
                name,
                address,
                phone,
                coverImage:req.file.path,
        },
       { where: { id: id },})) as unknown as VendorAttributes;
    
       if(updatedVendor){
        const Vendor = (await VendorInstance.findOne({where: {id:id}})) as unknown as VendorAttributes; 
       return res.status(200).json({
        message: "You have successfully updated your profile",
        Vendor
    })
       }
    return res.status(400).json({
        message:"Error occured"
    });
    
        }catch(err){
            res.status(500).json({
                Error:"Internal server Error",
                route: "/vendor/update-vendor-profile",
            });   
        }
    }

    // /**==================== Get Food ByVendor Id========================**/
export const GetFoodByVendor = async (req: Request, res: Response) => {
    try {

        const id = req.params.id;

        //check if vendor exist
        const Vendor = (await VendorInstance.findOne({
            where: { id: id },
            //attributes: ["id", "email", "name", "ownerName", "address", "phone", "serviceAvailable", "rating"],
            include: [
                {
                    model: FoodInstance,
                    as: 'food',
                    attributes: [
                        "id", "name", "description", "category", "foodType", "readyTime", "price", "rating", "vendorId", "image"]
                },
            ],
        })) as unknown as VendorAttributes;
        return res.status(200).json({
            Vendor
        })

    } catch (err) {
        res.status(500).json({
            Error: "Internal server Error",
            route: "/vendors/get-vendor-food/:id"
        });
    }
}


