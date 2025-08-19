import prisma from "../lib/prisma.js";

/**
 * ADMIN only (protect with isAdmin middleware at the router level)
 * Supports optional filters and pagination.
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where = status ? { status } : {};

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(pageSize),
    });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Get All Orders Error:", error);
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/**
 * Returns orders for the logged-in user.
 * Optional ?status=...
 */
const getUserOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status
      ? { userId: req.user.id, status }
      : { userId: req.user.id };

    const orders = await prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Get user orders Error:", error);
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/**
 * Create an order (from client-provided items).
 * - Merges duplicate productIds
 * - Validates products exist and stock
 * - Snapshots product price in order items
 */
const createOrder = async (req, res) => {
  const userId = Number(req.user.id);
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "No order items provided" });
  }

  try {
    // Merge duplicate productIds (sum quantities)
    const merged = items.reduce((acc, it) => {
      const pid = Number(it.productId);
      const qty = Number(it.quantity) || 0;
      if (!pid || qty <= 0) return acc;
      acc[pid] = (acc[pid] || 0) + qty;
      return acc;
    }, {});
    const mergedItems = Object.entries(merged).map(([productId, quantity]) => ({
      productId: Number(productId),
      quantity: Number(quantity),
    }));

    if (mergedItems.length === 0) {
      return res.status(400).json({ message: "No valid order items provided" });
    }

    // Fetch all involved products in one query
    const productIds = mergedItems.map((it) => it.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate existence and stock (best-effort UX check)
    for (const it of mergedItems) {
      const product = productMap.get(it.productId);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product ${it.productId} not found` });
      }
      if (product.stock < it.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Only ${product.stock} left.`,
        });
      }
    }

    // Create order and order items (snapshot prices)
    const order = await prisma.order.create({
      data: {
        user: { connect: { id: userId } },
        status: "PENDING",
        items: {
          create: mergedItems.map((it) => {
            const product = productMap.get(it.productId);
            return {
              product: { connect: { id: it.productId } },
              quantity: it.quantity,
              price: product.price,
            };
          }),
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    return res.status(201).json({ message: "Order created", order });
  } catch (error) {
    console.error("Create Order Error:", error);
    return res.status(500).json({ message: "Order creation failed" });
  }
};

/**
 * Pay for an order:
 * - param name chosen as :id in router, so we read req.params.id
 * - Transactional: re-check stock & decrement + set order to PURCHASED in a transaction
 */
const payOrder = async (req, res) => {
  const userId = Number(req.user.id);
  const idParam = req.params.id || req.params.orderId;
  const orderId = Number(idParam);

  if (!orderId) {
    return res.status(400).json({ message: "Order id is required" });
  }

  try {
    // Use a transaction to avoid race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Lock the order row by selecting it (Prisma doesn't offer explicit row-level locks,
      // but doing all within the transaction reduces race windows)
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } },
      });

      if (!order) {
        throw { status: 404, message: "Order not found" };
      }
      if (order.userId !== userId) {
        throw { status: 401, message: "Not authorized to pay for this order" };
      }
      if (order.status === "PURCHASED") {
        throw { status: 400, message: "Order already paid" };
      }

      // Re-check stock for each product and prepare updates
      for (const item of order.items) {
        const product = item.product;
        if (!product) {
          throw { status: 404, message: `Product ${item.productId} not found` };
        }
        if (product.stock < item.quantity) {
          throw {
            status: 400,
            message: `Insufficient stock for ${product.name}.`,
          };
        }
      }

      // Decrement stock for all items
      const updates = order.items.map((item) =>
        tx.product.update({
          where: { id: item.productId },
          data: { stock: item.product.stock - item.quantity },
        })
      );
      await Promise.all(updates);

      // Mark order as purchased
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: "PURCHASED" },
        include: { items: { include: { product: true } } },
      });

      return updatedOrder;
    });

    return res.status(200).json({ message: "Order paid", order: result });
  } catch (error) {
    // Handle thrown objects from inside transaction
    if (error && error.status && error.message) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Pay Order Error:", error);
    return res.status(500).json({ message: "Order payment failed" });
  }
};

export { getAllOrders, getUserOrders, createOrder, payOrder };
