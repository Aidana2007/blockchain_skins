// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SteamToken is ERC20, Ownable {

    address public crowdfundingContract;
    address public marketplaceContract;

    constructor() ERC20("SteamToken", "STM") Ownable(msg.sender) {}

    function setCrowdfundingContract(address _crowdfunding) external onlyOwner {
        require(crowdfundingContract == address(0), "Already set");
        crowdfundingContract = _crowdfunding;
    }

    function setMarketplaceContract(address _marketplace) external onlyOwner {
        require(marketplaceContract == address(0), "Already set");
        marketplaceContract = _marketplace;
    }

    function mint(address to, uint256 amount) external {
        require(
            msg.sender == crowdfundingContract ||
            msg.sender == marketplaceContract,
            "Not authorized"
        );
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(msg.sender == marketplaceContract, "Not authorized");
        _burn(from, amount);
    }
}
