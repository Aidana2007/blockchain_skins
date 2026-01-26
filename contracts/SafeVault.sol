// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SafeVault is ReentrancyGuard {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // ✅ FIX: nonReentrant + сначала эффекты, потом взаимодействие
    function withdraw() external nonReentrant {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");

        balances[msg.sender] = 0; // сначала обнулили

        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Send failed");
    }

    function vaultBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
