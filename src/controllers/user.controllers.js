import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadonCloudinary } from "../utils/FileUpload.js";

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
  console.log("userName", username);

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

  const coverImageLocalPath = req.files?.coverImage[0]?.path;

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

export { registerUser };
