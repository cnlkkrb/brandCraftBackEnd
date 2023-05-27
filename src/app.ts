// Import the express module
import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
//import userRoutes from './routes/userRoutes'
import { IndustryData } from "./industryData/data";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import imageGenerationRoutes from "./routes/imageGenerationRoutes";
import accessTokenRoutes from './routes/accessTokenRoutes';

dotenv.config();
// Create an instance of the express application
const app = express();
app.use(express.json());
app.use(cors());
setTimeout(() => {
  connectDB();
}, 3000);
// Define a port number
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "";

//routes go here
/* app.use('/users', userRoutes) */
app.use('/generate-image', imageGenerationRoutes)
app.use('/access-tokens', accessTokenRoutes)


app.get("/api/data", (req, res) => {
  res.json(IndustryData);
});

//Industry item save
const data: any[] = [];
app.post("/api/saveData", (req, res) => {
  const selectedData = req.body.data;
  data.push(selectedData);
  const savedItem = { text: selectedData.text };
  res.json(savedItem);
});

//Business save
const businessSchema = new mongoose.Schema({
  business: String,
  location: String,
  year: Number,
  competitors: [String],
});
const Business = mongoose.model("Business", businessSchema);
app.post("/save-business", async (req, res) => {
  const { business, location, year, competitors } = req.body;
  const newBusiness = new Business({
    business,
    location,
    year,
    competitors,
  });

  try {
    await newBusiness.save();
    res.status(200).send("Data saved successfully");
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).send("Error saving data");
  }
});

//Product save
const productSchema = new mongoose.Schema({
  productName: String,
  description: String,
});
const Product = mongoose.model("Product", productSchema);
app.post("/save-info", async (req, res) => {
  const { productName, description } = req.body;
  const newProduct = new Product({
    productName,
    description,
  });
  try {
    await newProduct.save();
    res.status(200).send("Data saved successfully");
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).send("Error saving data");
  }
});

app.post("/save-option", (req, res) => {
  const selectedOption = req.body.selectedOption;
  console.log("Selected option:", selectedOption);
  res.status(200).json({ message: "Option saved successfully" });
});

// Register endpoint
const NewUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const NewUser = mongoose.model("User", NewUserSchema);

export const User = NewUser

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await NewUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new NewUser({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("Request body:", req.body);

  try {
    const user = await User.findOne({ email });

    console.log("User:", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordMatch =
      password && user.password
        ? bcrypt.compareSync(password, user.password)
        : false;

    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const token = jwt.sign({ id: user._id }, "secretkey");
    res.json({ token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isPasswordMatch =
      password && user.password
        ? bcrypt.compareSync(password, user.password)
        : false;

    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, "secretkey");

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});


//save Content Tone
app.post('/api/saveSelectedData', (req, res) => {
  const { selectedData } = req.body;
  console.log('Selected Data:', selectedData);
  res.json({ message: 'Data saved successfully' });
});


export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("connected");
    return;
  } catch (error) {
    console.log(error);
  }
}

// Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
