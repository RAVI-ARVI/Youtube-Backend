import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadonCloudinary } from "../utils/FileUpload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ ValidateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res, next) => {
  //get user details from frontend
  //validation not empty and isEmail ...ect
  //check if user already exists (username and email)
  //check for images, check for avatar (any image or files)
  // upload them to cloudinary,avatar or files
  //create user object - create entry in db
  //remove password and refresh token field from response
  // check for user creation
  // return response

  //1. get user details from frontend
  const { username, email, fullName, password } = req.body;

  //2. validation

  // if (username === "" || undefined || null) {  //this is not wrong but this is beginners do this
  //   throw new ApiError(400, "User Name is Required");
  // }

  //advance method
  if (
    [username, email, fullName, password].some((filed) => filed?.trim() === "")
  ) {
    throw new ApiError(400, "All filed are required");
  }

  //3.checking if the user is already is there or not

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(
      409,
      "User already exists with the same username or email"
    );
  }

  //4. Handling The Files and Images

  const avatarLocalPath = req.files?.avatar[0]?.path; // user.router.js lo middleware (upload.fields) dhawara ikkadadiki vasthay same keys (avathar,coverImage)

  const coverImageLocalPath =
    req.files?.coverImage?.length > 0 ? req.files?.coverImage[0]?.path : "";

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is Required");
  }

  // 5. Uploading to Cloudinary
  const avatar = await uploadonCloudinary(avatarLocalPath);

  const coverImage = await uploadonCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is Required");
  }

  // 6. Creating User and Saving to Database
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // 7. removing password and refresh token from response

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // 8. Checking User Creation
  if (!createdUser) {
    throw new ApiError(500, "Some Thing went wrong in User Registration");
  }

  // 9. Sending Response

  res.status(201).json({
    success: true,
    createdUser,
  });
});

const loginUser = asyncHandler(async (req, res, next) => {
  //req data from user
  //username or email
  //find user
  //password check
  //access and refresh token
  //sen cookie
  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new ApiError(400, "Email or username is  required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User not Found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(404, "Invalidate Password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      success: true,
      message: "User login Successfully",
      user: loggedInUser,
      accessToken,
      refreshToken,
    });
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({
      success: true,
      message: "User logged out Successfully",
      user,
    });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized Request");
    }

    const decodedToken = await jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user?._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        message: "Access token refreshed",
        accessToken,
        refreshToken,
      });
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Something went wrong in generating refresh token"
    );
  }
});

export { loginUser, logoutUser, refreshAccessToken, registerUser };
