// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleVoting is Ownable {
    struct Candidate {
        string name;
        uint256 votes;
    }

    Candidate[] public candidates;
    mapping(address => bool) public hasVoted;

    constructor() Ownable(msg.sender) {}

    function addCandidate(string calldata name) external onlyOwner {
        require(bytes(name).length > 0, "Empty name");
        candidates.push(Candidate({name: name, votes: 0}));
    }

    function vote(uint256 candidateId) external {
        require(!hasVoted[msg.sender], "Already voted");
        require(candidateId < candidates.length, "Invalid candidate");

        hasVoted[msg.sender] = true;
        candidates[candidateId].votes += 1;
    }

    function getCandidatesCount() external view returns (uint256) {
        return candidates.length;
    }

    function getCandidate(uint256 candidateId) external view returns (string memory, uint256) {
        require(candidateId < candidates.length, "Invalid candidate");
        Candidate memory c = candidates[candidateId];
        return (c.name, c.votes);
    }
}
