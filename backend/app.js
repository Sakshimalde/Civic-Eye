import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import sendEmail from "./src/utils/sendEmail.js";


const app = express();

/* =========================
   ✅ CORS CONFIG (FINAL)
   ========================= */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (origin.startsWith("http://localhost")) {
        return callback(null, true);
      }

      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

/* =========================
   ✅ MIDDLEWARES
   ========================= */
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

/* =========================
   ✅ ROUTES
   ========================= */
import userRouter from "./src/routes/userRoute.js";
import complaintRouter from "./src/routes/complaintRouter.js";
import commentRouter from "./src/routes/commentRoute.js";
import voteRouter from "./src/routes/voteRoute.js";
import aiRoute from "./src/routes/aiValidationRoute.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/complaints", complaintRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/votes", voteRouter);
app.use("/api/v1/ai", aiRoute);

/* =========================
   ✅ GLOBAL ERROR HANDLER
   ========================= */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message
  });
});

app.get("/test-email", async (req, res) => {
  try {
      await sendEmail(
          "sakshimalde1824@gmail.com", // put your own email here
          "CivicEye Test Email",
          "<h1>Email is working!</h1>"
      );
      res.json({ success: true, message: "Email sent!" });
  } catch (err) {
      res.json({ success: false, error: err.message });
  }
});

export { app };
