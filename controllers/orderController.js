import prisma from "../lib/prisma.js";

const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    res.status(200).json({ orders });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;

    const orderItemsData = await Promise.all(
      items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product)
          throw new Error(`Product with id ${item.productId} not found`);

        return {
          product: { connect: { id: item.productId } },
          quantity: item.quantity,
          price: product.price, // lock the current price into the OrderItem
        };
      })
    );

    const newOrder = await prisma.order.create({
      data: {
        user: { connect: { id: userId } },
        items: {
          create: orderItemsData,
        },
      },
      include: {
        user: true,
        items: {
          include: { product: true },
        },
      },
    });

    res.status(201).json({ message: "Order created", newOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create order" });
  }
};

const payOrder = async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;
  if (!orderId)
    return res.status(400).json({ message: "Order id is required" });
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (userId !== order.userId)
      return res
        .status(401)
        .json({ message: "Not authorized to pay for this order" });
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PURCHASED",
      },
    });

    return res.status(200).json({ message: "Order paid", updatedOrder });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Order failed" });
  }
};

export { getAllOrders, createOrder, payOrder };
