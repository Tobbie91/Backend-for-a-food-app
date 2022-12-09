import express, { Request, Response } from "express";
import {
  registerSchema,
  option,
  GenerateSalt,
  GeneratePassword,
  GenerateOTP,
  onRequestOTP,
  emailHtml,
  sendMail,
  GenerateSignature,
  verifySignature,
  loginSchema,
  validatePassword,
  updateSchema,
} from "../utils";
import { UserInstance, UserAttributes } from "../model/userModel";
import { v4 as uuidv4 } from "uuid";
import { FromAdminMail, userSubject } from "../config";
import router from "../routes";
import { JwtPayload } from "jsonwebtoken";

/**==================== Register ========================**/
export const Register = async (req: Request, res: Response) => {
  try {
    const { email, phone, password, confirm_password } = req.body;
    const uuiduser = uuidv4();

    const validateResult = registerSchema.validate(req.body, option);
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }

    //Generate salt
    const salt = await GenerateSalt();
    const userPassword = await GeneratePassword(password, salt);

    //Generate OTP
    const { otp, expiry } = GenerateOTP();

    //Check if User exist
    const User = await UserInstance.findOne({ where: { email: email } });

    //Create User
    if (!User) {
      await UserInstance.create({
        id: uuiduser,
        email,
        password: userPassword,
        firstName: "",
        lastName: "",
        salt,
        address: "",
        phone,
        otp,
        otp_expiry: expiry,
        lng: 0,
        lat: 0,
        verified: false,
        role: "user",
      });

      //Send Otp to user
      // await onRequestOTP(otp, phone)

      // //Send Email
      const html = emailHtml(otp);

      await sendMail(FromAdminMail, email, userSubject, html);

      //check if user exist
      const User = (await UserInstance.findOne({
        where: { email: email },
      })) as unknown as UserAttributes;

      //Generate a signature
      let signature = await GenerateSignature({
        id: User.id,
        email: User.email,
        verified: User.verified,
      });

      return res.status(201).json({
        message:
          "User created successfully,check your email or phone number for OTP verification",
        signature,
        verified: User.verified,
      });
    }
    return res.status(400).json({
      message: "User already exist",
    });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/users/signup",
    });
  }
};

/**==================== Verify Users ========================**/
export const verifyUser = async (req: Request, res: Response) => {
  try {
    const token = req.params.signature;
    const decode = await verifySignature(token);

    //check if user is a registered user
    //check if user exist
    const User = (await UserInstance.findOne({
      where: { email: decode.email },
    })) as unknown as UserAttributes;

    if (User) {
      const { otp } = req.body;
      if (User.otp === parseInt(otp) && User.otp_expiry >= new Date()) {
        const updatedUser = (await UserInstance.update(
          {
            verified: true,
          },
          { where: { email: decode.email } }
        )) as unknown as UserAttributes;

        //Regnerate a new signature
        let signature = await GenerateSignature({
          id: updatedUser.id,
          email: updatedUser.email,
          verified: updatedUser.verified,
        });
        if (updatedUser) {
          const User = (await UserInstance.findOne({
            where: { email: decode.email },
          })) as unknown as UserAttributes;
          return res.status(200).json({
            message: "You have successfully verified your account",
            signature,
            verified: User.verified,
          });
        }
      }
    }
    return res.status(400).json({
      Error: "Invalid credential or OTP already expired",
    });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/users/verify",
    });
  }
};

/**==================== Login Users ========================**/
export const Login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const validateResult = loginSchema.validate(req.body, option);
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }
    //check if user exist
    const User = (await UserInstance.findOne({
      where: { email: email },
    })) as unknown as UserAttributes;

    if (User.verified === true) {
      const validation = await validatePassword(
        password,
        User.password,
        User.salt
      );
      //bcrypt.compare(password, User.password)

      if (validation) {
        //Regenerate a signature
        let signature = await GenerateSignature({
          id: User.id,
          email: User.email,
          verified: User.verified,
        });

        return res.status(200).json({
          message: "You have successfully logged in",
          signature,
          email: User.email,
          verified: User.verified,
          role: User.role,
        });
      }
    }
    return res.status(400).json({
      Error: "Wrong Username or password or not verified",
    });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/users/login",
    });
  }
};

/**==================== Resend OTP ========================**/
export const resendOTP = async (req: Request, res: Response) => {
  try {
    const token = req.params.signature;
    const decode = await verifySignature(token);
    //check if user exist
    const User = (await UserInstance.findOne({
      where: { email: decode.email },
    })) as unknown as UserAttributes;

    if (User) {
      //Generate OTP
      const { otp, expiry } = GenerateOTP();
      const updatedUser = (await UserInstance.update(
        {
          otp,
          otp_expiry: expiry,
        },
        { where: { email: decode.email } }
      )) as unknown as UserAttributes;
      if (updatedUser) {
        //Send Otp to user
        await onRequestOTP(otp, User.phone);

        //Send Email to User
        const html = emailHtml(otp);

        await sendMail(FromAdminMail, User.email, userSubject, html);

        return res.status(200).json({
          message: "OTP resend to registered phone number and email",
        });
      }
    }
    return res.status(400).json({
      Error: "Error sending OTP",
    });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/users/resend-otp/:signature",
    });
  }
};

/**==================== PROFILE ========================**/

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit as number | undefined;
    const users = await UserInstance.findAndCountAll({
      limit: limit,
    });
    res.status(200).json({
      message: "You have successfully retrieved all users",
      Count: users.count,
      Users: users.rows,
    });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/users/get-all-users",
    });
  }
};

export const getSingleUser = async (req: JwtPayload, res: Response) => {
  try {
    const id = req.user.id;

    //find user by id
    const User = (await UserInstance.findOne({
      where: { id: id },
    })) as unknown as UserAttributes;
    if (User) {
      return res.status(200).json({
        User,
      });
    }
    return res.status(400).json({
      message: "User not found",
    });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/users/get-user",
    });
  }
};

export const updateUserProfile = async (req: JwtPayload, res: Response) => {
  try {
    const id = req.user.id;
    const { firstName, lastName, address, phone } = req.body;

    //joi validation
    const validateResult = updateSchema.validate(req.body, option);
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }

    //check if user is a registered user
    const User = (await UserInstance.findOne({
      where: { id: id },
    })) as unknown as UserAttributes;
    if (!User) {
      return res.status(400).json({
        Error: "You are not authorized to update your profile",
      });
    }
    const updatedUser = (await UserInstance.update(
      {
        firstName,
        lastName,
        address,
        phone,
      },
      { where: { id: id } }
    )) as unknown as UserAttributes;

    if (updatedUser) {
      const User = (await UserInstance.findOne({
        where: { id: id },
      })) as unknown as UserAttributes;
      return res.status(200).json({
        message: "You have successfully updated your profile",
        User,
      });
    }
    return res.status(400).json({
      message: "Error occured",
    });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/users/update-profile",
    });
  }
};
