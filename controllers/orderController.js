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
  const userId = req.user.id;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "No order items provided" });
  }

  try {
    // 🔄 Check all item stock levels
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return res
          .status(404)
          .json({ message: `Product ${item.productId} not found` });
      }

      // ❗ New: Prevent over-ordering
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Only ${product.stock} left.`,
        });
      }
    }

    // ✅ Proceed to create order
    const order = await prisma.order.create({
      data: {
        user: { connect: { id: userId } },
        status: "PENDING",
        items: {
          create: await Promise.all(
            items.map(async (item) => {
              const product = await prisma.product.findUnique({
                where: { id: item.productId },
              });
              return {
                product: { connect: { id: item.productId } },
                quantity: item.quantity,
                price: product.price,
              };
            })
          ),
        },
      },
      include: {
        items: true,
      },
    });

    return res.status(201).json({ message: "Order placed", order });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ message: "Order failed" });
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
      include: { items: { include: { product: true } } }, // 📌 Include items and products
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (userId !== order.userId)
      // ✅ Corrected field: order.userId (not order.id)
      return res
        .status(401)
        .json({ message: "Not authorized to pay for this order" });

    if (order.status === "PURCHASED") {
      return res.status(400).json({ message: "Order already paid" });
    }

    // 🔄 Update stock levels
    for (const item of order.items) {
      const currentStock = item.product.stock;
      if (currentStock < item.quantity) {
        return res.status(400).json({
          message: `Product ${item.product.name} is out of stock.`,
        });
      }

      // 🧮 Deduct stock
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: currentStock - item.quantity, // 🔻 Decrease stock
        },
      });
    }

    // ✅ Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PURCHASED",
      },
    });

    return res.status(200).json({ message: "Order paid", updatedOrder });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Order payment failed" });
  }
};

export { getAllOrders, createOrder, payOrder };
