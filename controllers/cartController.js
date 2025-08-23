import prisma from "../lib/prisma";

const getCart = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    // return an empty cart shape when none exists (easier for frontend)
    if (!cart) {
      return res.status(200).json({ cart: { id: null, userId, items: [] } });
    }

    return res.status(200).json({ cart });
  } catch (error) {
    console.error("get cart error:", error);
    return res.status(500).json({ message: "Failed to fetch the cart" });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No cart items provided" });
    }

    // normalize and validate incoming items
    const normalized = items
      .map((it) => ({
        productId: Number(it.productId),
        quantity: Number(it.quantity) || 0,
      }))
      .filter((it) => it.productId && it.quantity > 0);

    if (normalized.length === 0) {
      return res.status(400).json({ message: "No valid cart items provided" });
    }

    const productIds = normalized.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // build map productId -> product
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate existence and stock, prepare itemsToCreate
    const itemsToCreate = normalized.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        // return a clear 404 for missing product
        throw {
          status: 404,
          message: `Product with ID ${item.productId} not found`,
        };
      }
      if (product.stock < item.quantity) {
        throw {
          status: 400,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        };
      }
      return {
        productId: product.id,
        quantity: item.quantity,
      };
    });

    // find existing cart
    const cart = await prisma.cart.findUnique({ where: { userId } });

    if (!cart) {
      // create cart and items
      const newCart = await prisma.cart.create({
        data: {
          user: { connect: { id: userId } },
          items: { createMany: { data: itemsToCreate } },
        },
        include: { items: true, user: true },
      });
      return res
        .status(201)
        .json({ message: "Items added to cart", cart: newCart });
    }

    // cart exists -> add items
    const updatedCart = await prisma.cart.update({
      where: { userId },
      data: {
        items: { createMany: { data: itemsToCreate } },
      },
      include: { items: true, user: true },
    });

    return res
      .status(200)
      .json({ message: "Items added to cart", cart: updatedCart });
  } catch (error) {
    console.error("Error adding to cart", error);
    if (error && error.status && error.message) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to add to cart" });
  }
};

const deleteFromCart = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const productId = Number(req.body.productId); // <- fixed

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ message: "user id and product id required" });
    }

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // use findFirst to get a single item
    const cartItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });
    if (!cartItem)
      return res.status(404).json({ message: "Cart item not found" });

    // delete (deleteMany is fine too)
    await prisma.cartItem.delete({ where: { id: cartItem.id } });

    return res
      .status(200)
      .json({ message: "Successfully deleted item from cart" });
  } catch (error) {
    console.error("error deleting item from cart", error);
    return res.status(500).json({ message: "Couldn't delete item from cart" });
  }
};

const deleteCart = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    if (!userId) return res.status(400).json({ message: "user id required" });

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      prisma.cart.delete({ where: { id: cart.id } }),
    ]);

    return res.status(200).json({ message: "Cart deleted successfully" });
  } catch (error) {
    console.error("error deleting cart", error);
    return res.status(500).json({ message: "Couldn't delete cart" });
  }
};
