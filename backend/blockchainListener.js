const { ethers } = require("ethers");
const Campaign = require("./models/Campaign");
const Skin = require("./models/Skin");
const { 
  CROWDFUNDING_ABI, 
  SKIN_PAYMENT_ABI, 
  getContractAddresses 
} = require("./config/contracts");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const addresses = getContractAddresses();

const listen = () => {
  // Listen to CampaignCreated events
  if (addresses.crowdfunding && addresses.crowdfunding !== "") {
    const crowdfundingContract = new ethers.Contract(
      addresses.crowdfunding,
      CROWDFUNDING_ABI,
      provider
    );

    crowdfundingContract.on(
      "CampaignCreated",
      async (id, title, goal, deadline) => {
        try {
          console.log("New campaign from blockchain:", id.toString());

          const campaign = new Campaign({
            title,
            goal: goal.toString(), // Store as Wei string to preserve precision
            deadline: new Date(Number(deadline) * 1000),
            blockchainId: Number(id),
          });

          await campaign.save();
          console.log("Campaign saved to MongoDB");
        } catch (err) {
          console.error("Error saving campaign:", err);
        }
      }
    );
    console.log("Listening to CampaignCreated events...");
  } else {
    console.warn("CROWDFUNDING_ADDRESS not set, skipping campaign listener");
  }

  // Listen to SkinPurchased events
  if (addresses.skinPayment && addresses.skinPayment !== "") {
    const skinPaymentContract = new ethers.Contract(
      addresses.skinPayment,
      SKIN_PAYMENT_ABI,
      provider
    );

    skinPaymentContract.on(
      "SkinPurchased",
      async (buyer, skinId, price, platformFee) => {
        try {
          console.log("Skin purchased from blockchain:");
          console.log("  Buyer:", buyer);
          console.log("  Blockchain Skin ID:", skinId.toString());
          console.log("  Price:", ethers.formatUnits(price, 18), "STM");
          console.log("  Platform Fee:", ethers.formatUnits(platformFee, 18), "STM");

          // Find skin by blockchainId (numeric ID from contract)
          const skin = await Skin.findOne({ blockchainId: Number(skinId) });
          if (skin) {
            skin.owner = buyer;
            await skin.save();
            console.log(`Skin "${skin.name}" ownership updated to ${buyer}`);
          } else {
            console.warn(`Skin with blockchain ID ${skinId.toString()} not found in database`);
          }
        } catch (err) {
          console.error("Error updating skin ownership:", err);
        }
      }
    );
    console.log("Listening to SkinPurchased events...");
  } else {
    console.warn("SKIN_PAYMENT_ADDRESS not set, skipping skin purchase listener");
  }
};

module.exports = listen;
