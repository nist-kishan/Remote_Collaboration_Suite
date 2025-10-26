import { ApiError } from "../utils/ApiError.js";
import { asyncHandle } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import {
  isAllowedEmail,
  isValidPhone,
} from "../validations/auth.validation.js";
import {
  deleteFromUrl,
  uploadOnCloudinary,
} from "../utils/uploadOnCloudinary.js";
import { generateAccessAndRefreshToken } from "../utils/generateAccessTokenAndRefreshToken.js";
import { options } from "../constraint/options.contraint.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendMail } from "../utils/sendMail.js";
import { otpTemplate, resetPasswordTemplate } from "../utils/mailTemplates.js";
import crypto from "crypto";
import { generateOTP } from "../utils/generateOtp.js";
import jwt from "jsonwebtoken";

export const signupHandler = asyncHandle(async (req, res) => {
  const { name, email, username, password, countrycode, phone } = req.body;

  if (
    [name, email, username, password, countrycode, phone].some(
      (field) => field.trim() == ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  if (!isValidPhone(phone)) {
    throw new ApiError(
      400,
      "Phone number must be 9–12 digits (excluding country code)"
    );
  }

  if (!isAllowedEmail(email)) {
    throw new ApiError(
      400,
      "Email domain not allowed. Allowed: gmail.com, outlook.com, kishan.com, github.com or Apple emails only"
    );
  }
  const existUser = await User.findOne({
    $or: [
      { email: email.toLowerCase().trim() },
      { username: username.toLowerCase().trim() },
      { phone },
    ],
  });

  if (existUser) {
    if (existUser.username === username.toLowerCase().trim()) {
      throw new ApiError(409, "This username already exists");
    }
    if (existUser.email === email.toLowerCase().trim()) {
      throw new ApiError(409, "This email already exists");
    }
    if (existUser.phone === phone) {
      throw new ApiError(409, "This phone already exists");
    }
  }

  let avatarCloudinaryUrl = "";
  if (req.file) {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
      throw new ApiError(404, "Image local url not found");
    }
    avatarCloudinaryUrl = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarCloudinaryUrl) {
      throw new ApiError(
        401,
        "Something happened with uploading avatar on cloudinary"
      );
    }
  }

  if (password.length < 6) {
    throw new ApiError(
      400,
      "Password is required and should be at least 6 characters"
    );
  }

  const newUser = new User({
    name,
    email: email.toLowerCase().trim(),
    username: username.toLowerCase().trim(),
    password,
    countrycode,
    phone,
    avatar: avatarCloudinaryUrl?.url || "",
  });

  const savedUser = await newUser.save();

  const userResponse = await User.findById(savedUser._id).select(
    "-password -refreshToken -resetPasswordToken -resetPasswordExpires -otp"
  );

  if (!userResponse) {
    throw new ApiError(500, "Error in creating user");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    savedUser._id
  );

  return res
    .status(201)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .cookie("theme", userResponse.theme, options)
    .json(
      new ApiResponse(201, "User registered and logged in successfully", {
        user: userResponse,
        accessToken,
        refreshToken,
      })
    );
});

export const signinHandler = asyncHandle(async (req, res) => {
  // take input data
  const { credential, password } = req.body;

  // change email or user name or phone  and password are filled or not
  if ([credential, password].some((field) => field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findOne({
    $or: [{ email: credential }, { username: credential }],
  });

  // check password is correct or not
  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, "Invalid user credential");
  }

  //generate access token and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // update access token in database
  const loggedInUser = await User.findByIdAndUpdate(
    user._id,
    {
      $set: { refreshToken },
    },
    { new: true }
  ).select(
    "-password -refreshToken -resetPasswordToken -resetPasswordExpires -otp"
  );

  return res
    .status(201)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .cookie("theme", user.theme, options)
    .json(
      new ApiResponse(201, "user successfully login in", {
        user: loggedInUser,
      })
    );
});

export const logoutHandler = asyncHandle(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  // update refresh token in database
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: "" } },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, "Logout successful"));
});

export const currentUserHandler = asyncHandle(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, "Current user fetched successfully", {
      user: req.user,
    })
  );
});

export const refreshTokenHandler = asyncHandle(async (req, res) => {
  const incommingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;
  if (!incommingRefreshToken) {
    throw new ApiError(401, "No refresh token provided");
  }
  let decodedToken;
  try {
    decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  if (!decodedToken) {
    throw new ApiError(401, "Invalid or Expire refresh token");
  }

  const user = await User.findById(decodedToken.id).select(
    "-password -resetPasswordToken -resetPasswordExpires -otp"
  );
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (incommingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Refresh token does not match");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user.id
  );

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(200, "Access token refreshed successfully", {
        user,
        accessToken,
        refreshToken,
      })
    );
});

export const resetPasswordHandler = asyncHandle(async (req, res) => {

  const { credential } = req.body;
  if (!credential) {
    throw new ApiError(400, "User credential is required");
  }

  const user = await User.findOne({
    $or: [{ email: credential }, { username: credential }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires =
    Date.now() + parseInt(process.env.RESET_PASSWORD_TOKEN_EXPIRY);

  await user.save({ validateBeforeSave: false });

  const frontUrl = process.env.FRONTEND_URI;
  const resetUrl = `${frontUrl}/reset-password/${resetToken}`;

  try {
    await sendMail({
      to: user.email,
      subject: "Reset Your Password",
      text: `Click this link to reset: ${resetUrl}`,
      html: resetPasswordTemplate(user.name, resetUrl),
    });
    return res
      .status(200)
      .json(new ApiResponse(200, "Password reset email sent successfully"));
  } catch (error) {
    // Clean up the reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Provide more specific error messages
    let errorMessage = "Failed to send password reset email";
    if (error.code === 'ETIMEDOUT') {
      errorMessage = "Email service is temporarily unavailable. Please try again later.";
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = "Email service connection failed. Please try again later.";
    } else if (error.responseCode === 535) {
      errorMessage = "Email authentication failed. Please contact support.";
    }

    return res
      .status(500)
      .json(new ApiResponse(500, errorMessage));
  }
});

export const changePasswordWithLinkHandler = asyncHandle(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  if ([token, newPassword].some((field) => field.trim() === "")) {
    throw new ApiError(400, "All field are required");
  }
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired password reset token");
  }
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Password has been reset successfully"));
});

export const otpSendHandler = asyncHandle(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let otp;
  const now = Date.now();

  if (user.otp && user.optExpire && user.optExpire > now) {
    otp = user.otp;
  } else {
    otp = generateOTP(6);
    user.otp = otp;
    user.optExpire = now + parseInt(process.env.OTP_EXPIRY);
    user.isVerify = false;
    await user.save({ validateBeforeSave: false });
  }

  try {
    await sendMail({
      to: user.email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
      html: otpTemplate(user.name, otp),
    });

    return res.status(200).json(new ApiResponse(200, "OTP sent successfully"));
  } catch (error) {
    // Clean up the OTP
    user.otp = undefined;
    user.optExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // Provide more specific error messages
    let errorMessage = "Failed to send OTP email";
    if (error.code === 'ETIMEDOUT') {
      errorMessage = "Email service is temporarily unavailable. Please try again later.";
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = "Email service connection failed. Please try again later.";
    } else if (error.responseCode === 535) {
      errorMessage = "Email authentication failed. Please contact support.";
    } else if (error.message && error.message.includes('Invalid login')) {
      errorMessage = "Email authentication failed. Check your email configuration.";
    }

    return res
      .status(500)
      .json(new ApiResponse(500, errorMessage));
  }
});

export const otpVerifyHandler = asyncHandle(async (req, res) => {
  const { otp } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) throw new ApiError(404, "User not found");

  const now = Date.now();

  if (!user.otp || !user.optExpire || user.optExpire < now) {
    throw new ApiError(400, "OTP expired or not found");
  }

  if (user.otp != otp.otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  user.isVerify = true;
  user.otp = null;
  user.optExpire = null;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "OTP verified successfully"));
});

export const changePasswordHandler = asyncHandle(async (req, res) => {
  // fetch input data
  const { password, newPassword } = req.body;
  if ([password, newPassword].some((field) => field.trim() === "")) {
    throw new ApiError(400, "All field are required");
  }

  // fetch user and user id will get fro middleware
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(401, "Autthenication is required");
  }

  // update password
  if (!(await user.isPasswordCorrect(password))) {
    throw new ApiError(409, "Invalid Password");
  }
  user.password = newPassword;

  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, "Successfully update your Password"));
});

export const updateAvatarHandler = asyncHandle(async (req, res) => {
  // fetch image from middlware
  if (!req.file) {
    throw new ApiError(404, "Image not find");
  }
  // find local File Url
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(404, "Image local url not found");
  }
  // Upload on cloudinary
  let avatarCloudinaryUrl = "";
  try {
    avatarCloudinaryUrl = await uploadOnCloudinary(avatarLocalPath);
  } catch (error) {
    throw new ApiError(400, "Something issue in updating Profile picture");
  }
  if (!avatarCloudinaryUrl.url) {
    throw new ApiError(
      401,
      "Something happened with uploading avatar on cloudinary"
    );
  }

  // delete the previous image url and update the url
  if (req.user.avatar) {
    await deleteFromUrl(req.user.avatar);
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: avatarCloudinaryUrl.url } },
    { new: true }
  ).select(
    "-password -refreshToken -resetPasswordToken -resetPasswordExpires -otp"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, "Profile picture updated successfully", { user }));

});

export const updateProfileHandler = asyncHandle(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  const userId = req.user._id;
  const { name, username, bio, designation, location } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Update text fields
  if (name) user.name = name;
  if (username) user.username = username;
  if (bio !== undefined) user.bio = bio;
  if (designation !== undefined) user.designation = designation;
  if (location !== undefined) user.location = location;

  // Handle avatar upload
  if (req.file) {
    user.avatar = `/uploads/${req.file.filename}`;
  }

  await user.save({ validateBeforeSave: true });

  const responseData = {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      designation: user.designation,
      location: user.location,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    }
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Profile updated successfully",
        responseData
      )
    );
});

export const themeHandler = asyncHandle(async (req, res) => {
  const currentTheme = req.cookies?.theme ? req.cookies.theme === "true" : true;
  const newTheme = !currentTheme;

  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (incomingRefreshToken) {
    try {
      const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      const user = await User.findById(decodedToken.id);
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      user.theme = newTheme;
      await user.save({ validateBeforeSave: false });
    } catch (error) {
      throw new ApiError(404, error.message);
    }
  } else {
    throw new ApiError(404, "Refresh token not found");
  }
  res
    .status(200)
    .cookie("theme", String(newTheme), options)
    .json(new ApiResponse(200, "Theme changed", { theme: newTheme }));
});