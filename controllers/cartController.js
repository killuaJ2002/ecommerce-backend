import prisma from "../lib/prisma";

const getCart = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const cart = await prisma.cart.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return res.status(200).json({ cart });
  } catch (error) {
    console.log("get cart error:", error);
    return res.status(500).json({ message: "Failed to fetch the cart" });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length == 0) {
      return res.status(400).json({ message: "No cart items provided" });
    }

    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    const productMap = new Map(
      products.map((p) => {
        p.id, p;
      })
    );

    // Validate and prepare items
    const itemsToCreate = items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
        );
      }

      return {
        productId: product.id,
        quantity: item.quantity,
      };
    });

    const cart = await prisma.cart.findUnique({
      where: {
        userId,
      },
    });

    if (!cart) {
      try {
        const newCart = await prisma.cart.create({
          where: { userId },
          data: {
            items: {
              createMany: {
                data: itemsToCreate,
              },
            },
          },
          include: {
            items: true,
            user: true,
          },
        });
        return res
          .status(201)
          .json({ message: "Items added to cart", newCart });
      } catch (error) {
        console.log("Error adding to cart", error);
        return res.status(500).json({ message: "Failed to add to cart" });
      }
    }

    const updatedCart = await prisma.cart.update({
      where: { userId },
      data: {
        items: {
          createMany: {
            data: itemsToCreate,
          },
        },
      },
      include: {
        items: true,
        user: true,
      },
    });
    return res
      .status(201)
      .json({ message: "Items added to cart", updatedCart });
  } catch (error) {
    console.log("Error adding to cart", error);
    return res.status(500).json({ message: "Failed to add to cart" });
  }
};

const deleteFromCart = (req, res) => {};
