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
    const { userId, items } = req.body;

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

export { getAllOrders, createOrder };
