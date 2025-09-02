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

const addAddress = (req, res) => {
  res.status(201).json({ message: "address added" });
};

const editAddress = (req, res) => {
  res.status(200).json({ message: "address updated" });
};

const deleteAddress = (req, res) => {
  res.status(200).json({ message: "address deleted" });
};

export { getAddresses, addAddress, editAddress, deleteAddress };
