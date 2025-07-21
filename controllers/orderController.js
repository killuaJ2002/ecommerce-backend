import prisma from "../lib/prisma";

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
    const { userId, items } = req.body;
    const newOrder = await prisma.order.create({
      data: {
        user: { connect: { id: userId } },
        items: {
          create: items.map((item) => ({
            product: { connect: { id: item.productId } },
            quantity: item.quantity,
          })),
        },
      },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    res.status(201).json({ message: "Order created", newOrder });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to create order" });
  }
};

export { getAllOrders, createOrder };
