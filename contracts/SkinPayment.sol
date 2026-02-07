// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SteamToken.sol";

contract SkinPayment {
    SteamToken public steamToken;

    address public platformOwner;
    uint256 public platformFeePercent = 1;

    constructor(address _tokenAddress) {
        steamToken = SteamToken(_tokenAddress);
        platformOwner = msg.sender;
    }

    event SkinPurchased(
        address indexed buyer,
        uint256 indexed skinId,
        uint256 price,
        uint256 platformFee
    );

    function buySkin(uint256 skinId, uint256 price) external {
        require(price > 0, "Invalid price");

        uint256 fee = (price * platformFeePercent) / 100;
        uint256 sellerAmount = price - fee;

        require(
            steamToken.transferFrom(msg.sender, platformOwner, fee),
            "Fee transfer failed"
        );

        require(
            steamToken.transferFrom(msg.sender, address(this), sellerAmount),
            "Payment failed"
        );

        emit SkinPurchased(msg.sender, skinId, price, fee);
    }
}
