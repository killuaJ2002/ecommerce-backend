import prisma from "../lib/prisma.js";
import bcrypt, { hash } from "bcrypt";
import generateToken from "../utils/generateToken.js";
const saltRounds = 10;

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json({ users });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "error fetching users" });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: "This email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
    const token = generateToken(newUser.id);

    // Omit password before sending response
    const { password: _, ...userWithoutPassword } = newUser;

    res
      .status(201)
      .json({ message: "User created", token, user: userWithoutPassword });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const hashedPassword = user.password;
    const passwordMatch = await bcrypt.compare(password, hashedPassword);
    if (!passwordMatch)
      return res.status(401).json({ message: "Invalid credentials" });
    const token = generateToken(user.id);
    res.status(200).json({
      message: "Login succesfull",
      token,
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to log in" });
  }
};

export { getAllUsers, createUser, loginUser };
