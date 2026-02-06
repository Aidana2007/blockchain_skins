// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EcosystemNFT is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;

    constructor() ERC721("EcosystemNFT", "ENFT") Ownable(msg.sender) {}

    // Only owner can mint (для ассаймента так проще и безопаснее)
    function mint(address to, string calldata uri) external onlyOwner returns (uint256) {
        require(to != address(0), "Mint to zero address");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        return tokenId;
    }
        uint256 public constant NFT_SELL_PRICE = 0.01 ether;

    function sellNFT(uint256 _tokenId) external {
        require(ownerOf(_tokenId) == msg.sender, "Not the owner");
        require(address(this).balance >= NFT_SELL_PRICE, "Contract lacks ETH");

        // Transfer NFT to the contract (it must be approved first or use transferFrom)
        _transfer(msg.sender, address(this), _tokenId);
        
        (bool success, ) = payable(msg.sender).call{value: NFT_SELL_PRICE}("");
        require(success, "ETH transfer failed");
    }

    // Allow contract to receive ETH to pay for NFTs
    receive() external payable {}

}
