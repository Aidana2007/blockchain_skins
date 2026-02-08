// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./SteamToken.sol";
contract SkinPayment {
    SteamToken public steamToken;
    address public platformOwner;
    uint256 public platformFeePercent = 1; 
    event SkinPurchased(
        address indexed buyer,
        uint256 indexed skinId,
        uint256 price,
        uint256 platformFee,
        uint256 timestamp
    );
    event PlatformFeeUpdated(uint256 newFeePercent);
    constructor(address _tokenAddress) {
        require(_tokenAddress != address(0), "Invalid token address");
        steamToken = SteamToken(_tokenAddress);
        platformOwner = msg.sender;
    }
    function buySkin(uint256 skinId, uint256 price) external {
        require(price > 0, "Price must be greater than zero");
        require(skinId > 0, "Invalid skin ID");
        uint256 buyerBalance = steamToken.balanceOf(msg.sender);
        require(buyerBalance >= price, "Insufficient STM balance");
        uint256 platformFee = (price * platformFeePercent) / 100;
        uint256 burnAmount = price - platformFee;
        require(
            steamToken.transferFrom(msg.sender, platformOwner, platformFee),
            "Platform fee transfer failed"
        );
        steamToken.burn(msg.sender, burnAmount);
        emit SkinPurchased(
            msg.sender,
            skinId,
            price,
            platformFee,
            block.timestamp
        );
    }
    function calculatePrice(uint256 basePrice) 
        external 
        view 
        returns (uint256 totalPrice, uint256 platformFee) 
    {
        totalPrice = basePrice;
        platformFee = (basePrice * platformFeePercent) / 100;
        return (totalPrice, platformFee);
    }
    function setPlatformFee(uint256 _newFeePercent) external {
        require(msg.sender == platformOwner, "Only owner can set fee");
        require(_newFeePercent <= 5, "Fee cannot exceed 5%");
        platformFeePercent = _newFeePercent;
        emit PlatformFeeUpdated(_newFeePercent);
    }
    function canAffordSkin(address buyer, uint256 price) 
        external 
        view 
        returns (bool) 
    {
        return steamToken.balanceOf(buyer) >= price;
    }
    function getPlatformOwner() external view returns (address) {
        return platformOwner;
    }
    receive() external payable {
        revert("This contract does not accept ETH");
    }
}