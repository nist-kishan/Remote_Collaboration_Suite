import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import {
  changePasswordHandler,
  changePasswordWithLinkHandler,
  currentUserHandler,
  logoutHandler,
  otpSendHandler,
  otpVerifyHandler,
  refreshTokenHandler,
  resetPasswordHandler,
  signinHandler,
  signupHandler,
  themeHandler,
  updateAvatarHandler,
  updateProfileHandler,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const authRouter = Router();

authRouter.route("/signup").post(upload.single("avatar"), signupHandler);
authRouter.route("/signin").post(signinHandler);
authRouter.route("/logout").post(verifyToken, logoutHandler);
authRouter.route("/me").get(verifyToken, currentUserHandler);
authRouter.route("/refresh_token").get(refreshTokenHandler);
authRouter
  .route("/update_avatar")
  .post(verifyToken, upload.single("avatar"), updateAvatarHandler);
authRouter.route("/reset_password").post(resetPasswordHandler);
authRouter.route("/password_change").post(verifyToken, changePasswordHandler);
authRouter
  .route("/password_change_link/:token")
  .post(changePasswordWithLinkHandler);
authRouter.route("/send_otp").post(verifyToken, otpSendHandler);
authRouter.route("/otp_verification").post(verifyToken, otpVerifyHandler);
authRouter.route("/update-profile").put(verifyToken, updateProfileHandler);
authRouter.route("/theme").put(themeHandler);

export { authRouter };
