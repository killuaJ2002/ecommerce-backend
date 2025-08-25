import prisma from "../lib/prisma.js";

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

    // expect a single item: { productId, quantity }
    const productId = Number(req.body.productId);
    const quantity = Number(req.body.quantity) || 0;

    if (!userId || !productId || quantity <= 0) {
      return res
        .status(400)
        .json({ message: "productId and positive quantity required" });
    }

    // fetch product and basic stock UX check
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product)
      return res
        .status(404)
        .json({ message: `Product ${productId} not found` });
    if (product.stock < quantity) {
      return res.status(400).json({
        message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
      });
    }

    // get or create cart
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { user: { connect: { id: userId } } },
      });
    }

    // add one cart item (NOTE: this will create a new row even if the product already exists in the cart)
    const updatedCart = await prisma.cart.update({
      where: { userId },
      data: {
        items: {
          create: {
            productId: product.id,
            quantity,
          },
        },
      },
      include: { items: { include: { product: true } }, user: true },
    });

    return res
      .status(cart ? 200 : 201)
      .json({ message: "Item added to cart", cart: updatedCart });
  } catch (error) {
    console.error("Error adding to cart", error);
    return res.status(500).json({ message: "Failed to add to cart" });
  }
};

const deleteFromCart = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const cartItemId = Number(req.params.id); // cartItem primary key

    if (!userId || !cartItemId) {
      return res
        .status(400)
        .json({ message: "user id and cartItem id required" });
    }

    // Load the cartItem with its cart to verify ownership
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    if (!cartItem.cart || cartItem.cart.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this item" });
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });

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

export { getCart, addToCart, deleteFromCart, deleteCart };
