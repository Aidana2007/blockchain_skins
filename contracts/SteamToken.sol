// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract SteamToken is ERC20, Ownable {
    address public crowdfundingContract;
    address public skinPaymentContract;
    event CrowdfundingContractSet(address indexed contractAddress);
    event SkinPaymentContractSet(address indexed contractAddress);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    constructor() ERC20("SteamToken", "STM") Ownable(msg.sender) {}
    function setCrowdfundingContract(address _crowdfunding) external onlyOwner {
        require(_crowdfunding != address(0), "Invalid address");
        require(crowdfundingContract == address(0), "Crowdfunding contract already set");
        crowdfundingContract = _crowdfunding;
        emit CrowdfundingContractSet(_crowdfunding);
    }
    function setSkinPaymentContract(address _skinPayment) external onlyOwner {
        require(_skinPayment != address(0), "Invalid address");
        require(skinPaymentContract == address(0), "SkinPayment contract already set");
        skinPaymentContract = _skinPayment;
        emit SkinPaymentContractSet(_skinPayment);
    }
    function mint(address to, uint256 amount) external {
        require(
            msg.sender == crowdfundingContract || msg.sender == owner(),
            "Not authorized to mint"
        );
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than zero");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    function burn(address from, uint256 amount) external {
        require(msg.sender == skinPaymentContract, "Not authorized to burn");
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than zero");
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}