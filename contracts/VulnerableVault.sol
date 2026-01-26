// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VulnerableVault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // ❌ УЯЗВИМОСТЬ: отправляем ETH ДО того, как обнулили баланс
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");

        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Send failed");

        balances[msg.sender] = 0; // <-- слишком поздно
    }

    function vaultBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
