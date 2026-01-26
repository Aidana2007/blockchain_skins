// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error NotFound();
error EmptyBaseURI();

contract EcosystemNFTOptimized is ERC721, Ownable {
    uint256 private _nextId;
    string private _base;

    constructor(string memory baseURI_)
        ERC721("EcosystemNFT", "ENFT")
        Ownable(msg.sender)
    {
        if (bytes(baseURI_).length == 0) revert EmptyBaseURI();
        _base = baseURI_;
    }

    function mint(address to) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextId;
        unchecked {
            _nextId++;
        }
        _safeMint(to, tokenId);
    }

    function _baseURI() internal view override returns (string memory) {
        return _base;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert NotFound();
        return string(
            abi.encodePacked(_baseURI(), _toString(tokenId), ".json")
        );
    }

    function nextId() external view returns (uint256) {
        return _nextId;
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
