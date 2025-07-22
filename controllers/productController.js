import prisma from "../lib/prisma.js";

const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.status(200).json({ products });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    const newProduct = await prisma.product.create({
      data: { name, description, price, stock },
    });

    res.status(201).json({ message: "product created", newProduct });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to create product" });
  }
};

export { getAllProducts, createProduct };
