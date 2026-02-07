// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SteamToken.sol";

contract Crowdfunding {

    SteamToken public steamToken;
    address public platformOwner;
    uint256 public platformFeePercent = 5;
    uint256 public campaignCount;

    constructor(address _tokenAddress) {
        steamToken = SteamToken(_tokenAddress);
        platformOwner = msg.sender;
    }

    struct Campaign {
        string title;
        uint256 goal;
        uint256 deadline;
        uint256 amountRaised;
        address creator;
        bool finalized;
    }

    mapping(uint256 => Campaign) public campaigns;

    event CampaignCreated(uint256 id, string title, uint256 goal, uint256 deadline);
    event Funded(uint256 id, address user, uint256 amount);
    event Finalized(uint256 id);

    function createCampaign(
        string memory _title,
        uint256 _goal,
        uint256 _duration
    ) external {
        campaignCount++;

        campaigns[campaignCount] = Campaign({
            title: _title,
            goal: _goal,
            deadline: block.timestamp + _duration,
            amountRaised: 0,
            creator: msg.sender,
            finalized: false
        });

        emit CampaignCreated(campaignCount, _title, _goal, block.timestamp + _duration);
    }

    function fundCampaign(uint256 _id) external payable {
        Campaign storage c = campaigns[_id];
        require(block.timestamp < c.deadline, "Ended");

        c.amountRaised += msg.value;

        uint256 reward = msg.value * 1000;
        steamToken.mint(msg.sender, reward);

        emit Funded(_id, msg.sender, msg.value);
    }

    function finalize(uint256 _id) external {
        Campaign storage c = campaigns[_id];
        require(block.timestamp >= c.deadline, "Not ended");
        require(!c.finalized, "Done");

        c.finalized = true;

        uint256 fee = (c.amountRaised * platformFeePercent) / 100;
        uint256 creatorAmount = c.amountRaised - fee;

        payable(platformOwner).transfer(fee);
        payable(c.creator).transfer(creatorAmount);

        emit Finalized(_id);
    }
}
