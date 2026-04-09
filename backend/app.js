import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import sendEmail from "./src/utils/sendEmail.js";

const app = express();

/* =========================
   ✅ CORS CONFIG
   ========================= */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://187.127.148.7",
      // add your domain here if you have one e.g. "https://civiceye.sbs"
    ],
    credentials: true
  })
);

/* =========================
   ✅ MIDDLEWARES
   ========================= */
// Raised from 16kb → 50mb so multipart/form-data with images is not rejected
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use(cookieParser());

/* =========================
   ✅ ROUTES
   ========================= */
import userRouter      from "./src/routes/userRoute.js";
import complaintRouter from "./src/routes/complaintRouter.js";
import commentRouter   from "./src/routes/commentRoute.js";
import voteRouter      from "./src/routes/voteRoute.js";
import aiRoute         from "./src/routes/aiValidationRoute.js";

app.use("/api/v1/users",      userRouter);
app.use("/api/v1/complaints", complaintRouter);
app.use("/api/v1/comments",   commentRouter);
app.use("/api/v1/votes",      voteRouter);
app.use("/api/v1/ai",         aiRoute);

/* =========================
   ✅ TEST EMAIL ROUTE
   ========================= */
app.get("/test-email", async (req, res) => {
  try {
    await sendEmail(
      "sakshimalde1824@gmail.com",
      "CivicEye Test Email",
      "<h1>Email is working!</h1>"
    );
    res.json({ success: true, message: "Email sent!" });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

/* =========================
   ✅ GLOBAL ERROR HANDLER
   ========================= */
app.use((err, req, res, next) => {
  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "File too large. Maximum allowed size is 10MB for complaint photos and 5MB for profile photos."
    });
  }
  // Multer file type error
  if (err.message && err.message.includes("Only image files")) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  const statusCode = err.statusCode || 500;
  const message    = err.message    || "Internal Server Error";
  res.status(statusCode).json({ success: false, message });
});

export { app };