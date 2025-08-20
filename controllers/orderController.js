import prisma from "../lib/prisma.js";

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
 * Create an order AFTER successful payment.
 * - Merges duplicate productIds
 * - Validates products exist
 * - Atomically decrements stock (prevents oversell)
 * - Creates Order + OrderItems with price snapshots in a transaction
 *
 * Expected: call this after payment is confirmed (client after gateway success OR from payment webhook)
 *
 * Body example:
 * { items: [{ productId: 1, quantity: 2 }, { productId: 5, quantity: 1 }] }
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

    // Validate existence (final stock check & decrement happen transactionally)
    for (const it of mergedItems) {
      const product = productMap.get(it.productId);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product ${it.productId} not found` });
      }
    }

    // Transaction: atomically decrement stock (conditional) and create order
    const order = await prisma.$transaction(async (tx) => {
      // Attempt conditional (atomic) decrements for every product
      for (const it of mergedItems) {
        const result = await tx.product.updateMany({
          where: {
            id: it.productId,
            stock: { gte: it.quantity },
          },
          data: {
            stock: { decrement: it.quantity },
          },
        });

        // Prisma returns { count: n } for updateMany
        if (result.count === 0) {
          // Failed: insufficient stock (or concurrent decrement already consumed it)
          throw {
            status: 400,
            message: `Insufficient stock for product id ${it.productId} (${
              productMap.get(it.productId)?.name || "unknown"
            })`,
          };
        }
      }

      // All decrements succeeded — create the order with snapshot prices
      const created = await tx.order.create({
        data: {
          user: { connect: { id: userId } },
          status: "PURCHASED", // order created post-payment
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
        include: { items: { include: { product: true } } },
      });

      return created;
    });

    return res.status(201).json({ message: "Order created", order });
  } catch (error) {
    // handle thrown objects from transaction
    if (error && error.status && error.message) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Create Order Error:", error);
    return res.status(500).json({ message: "Order creation failed" });
  }
};

export { getAllOrders, getUserOrders, createOrder };
