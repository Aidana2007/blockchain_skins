const Skin = require("../models/Skin");
const User = require("../models/User");

const createSkin = async (req, res) => {
  try {
    const { name, priceSTM, description, image, blockchainId } = req.body;

    if (!name || !priceSTM) {
      return res.status(400).json({ msg: "Name and priceSTM are required" });
    }

    const skin = new Skin({ name, priceSTM, description, image, blockchainId });
    await skin.save();

    res.json(skin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error creating skin" });
  }
};

const getSkins = async (req, res) => {
  try {
    const skins = await Skin.find();
    res.json(skins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching skins" });
  }
};

const buySkin = async (req, res) => {
  try {
    const { skinId, transactionHash } = req.body;

    if (!skinId || !transactionHash) {
      return res.status(400).json({ msg: "skinId and transactionHash are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const skin = await Skin.findById(skinId);
    if (!skin) {
      return res.status(404).json({ msg: "Skin not found" });
    }

    if (skin.owner && skin.owner === user.walletAddress) {
      return res.status(400).json({ msg: "You already own this skin" });
    }

    if (skin.owner) {
      return res.status(400).json({ msg: "Skin already owned by someone else" });
    }

    // SECURITY NOTE: This endpoint is for frontend convenience only
    // The actual ownership update happens in blockchainListener.js
    // when the SkinPurchased event is emitted from the smart contract
    // In production, consider removing this endpoint entirely and
    // relying solely on the blockchain listener for state updates
    
    res.json({ 
      msg: "Skin purchase transaction received. Ownership will be updated when blockchain confirms the transaction.",
      transactionHash,
      note: "Please wait for blockchain confirmation"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error processing skin purchase" });
  }
};

const getOwnedSkins = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const ownedSkins = await Skin.find({ owner: user.walletAddress });
    res.json(ownedSkins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching owned skins" });
  }
};

module.exports = {
  createSkin,
  getSkins,
  buySkin,
  getOwnedSkins,
};
