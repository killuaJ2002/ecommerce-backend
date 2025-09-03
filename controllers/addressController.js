import prisma from "../lib/prisma.js";
const getAddresses = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const addresses = await prisma.address.findMany({
      where: { userId },
    });

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return res.status(404).json({ message: "No address found" });
    }
    return res.status(200).json({ addresses });
  } catch (error) {
    console.log("Error fetching addresses", error);
    return res.status(500).json({ message: "Failed to fetch addresses" });
  }
};

const addAddress = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { street, city, state, zipCode } = req.body;
    const newAddress = await prisma.address.create({
      data: {
        user: { connect: { id: userId } },
        street,
        city,
        state,
        zipCode,
      },
    });
    return res.status(201).json({ message: "New address added", newAddress });
  } catch (error) {
    console.log("Error creating new address", error);
    return res.status(500).json({ message: "Failed to add address" });
  }
};

const editAddress = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const id = Number(req.params.id);
    const { street, city, state, zipCode } = req.body;
    const address = await prisma.address.findUnique({
      where: { id },
    });
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }
    if (address.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this address" });
    }
    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        street,
        city,
        state,
        zipCode,
      },
    });
    return res.status(200).json({ message: "Address updated", updatedAddress });
  } catch (error) {
    console.log("Error updating address", error);
    return res.status(500).json({ message: "Failed to edit address" });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const id = Number(req.params.id);
    const address = await prisma.address.findUnique({
      where: { id },
    });
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }
    if (address.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this address" });
    }
    const deleted = await prisma.address.delete({
      where: { id },
    });
    return res.status(200).json({ message: "Address deleted", deleted });
  } catch (error) {
    console.log("Error deleting address", error);
    return res.status(500).json({ message: "Failed to delete address" });
  }
};

export { getAddresses, addAddress, editAddress, deleteAddress };
