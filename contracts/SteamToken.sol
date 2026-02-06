// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract STeamToken is ERC20, Ownable {
    uint256 public tokenPrice = 0.00025 ether;
    address public deployer;

    event TokensPurchased(address indexed buyer, uint256 amount, uint256 ethPaid, uint256 feePaid);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    
    mapping(address => bool) public minters; // Authorized contracts that can mint

    constructor(uint256 initialSupply)
        ERC20("STeamToken", "STM")
        Ownable(msg.sender)
    {
        deployer = msg.sender;
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    function setPrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be greater than zero");
        uint256 oldPrice = tokenPrice;
        tokenPrice = _newPrice;
        emit PriceUpdated(oldPrice, _newPrice);
    }

    function _buyTokens(address buyer, uint256 ethAmount) internal {
        require(ethAmount > 0, "Send ETH to buy tokens");
        
        uint256 fee = ethAmount / 100; // 1% fee
        uint256 netAmount = ethAmount - fee;
        
        // calculate tokens based on the current dynamic price
        uint256 tokensToMint = (netAmount * 10 ** decimals()) / tokenPrice;
        require(tokensToMint > 0, "Insufficient ETH for minimum token amount");

        // send 1% fee to deployer
        (bool success, ) = payable(deployer).call{value: fee}("");
        require(success, "Fee transfer failed");

        _mint(buyer, tokensToMint);
        
        emit TokensPurchased(buyer, tokensToMint, ethAmount, fee);
    }

    function buyTokens() external payable {
        _buyTokens(msg.sender, msg.value);
    }


    function updateDeployer(address _newDeployer) external onlyOwner {
        require(_newDeployer != address(0), "Invalid address");
        deployer = _newDeployer;
    }
        modifier onlyMinter() {
        require(owner() == msg.sender || minters[msg.sender], "Not authorized to mint");
        _;
    }

    function addMinter(address _minter) external onlyOwner {
        minters[_minter] = true;
    }

    // Sell STM tokens back to the contract for ETH
    function sellTokens(uint256 _amount) external {
        require(_amount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= _amount, "Insufficient balance");

        uint256 ethAmount = (_amount * tokenPrice) / 10**decimals();
        require(address(this).balance >= ethAmount, "Contract has insufficient ETH");

        _burn(msg.sender, _amount);
        (bool success, ) = payable(msg.sender).call{value: ethAmount}("");
        require(success, "ETH transfer failed");
    }

    // Change mint function to use onlyMinter
    function mint(address to, uint256 amount) external onlyMinter {
        require(to != address(0), "Mint to zero address");
        _mint(to, amount);
    }

    receive() external payable {
        _buyTokens(msg.sender, msg.value);
    }
}
