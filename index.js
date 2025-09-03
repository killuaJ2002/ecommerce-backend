import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/user", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
