// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SteamToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Crowdfunding is Ownable {
    struct Campaign {
        address creator;
        string title;
        uint256 goal;
        uint256 deadline;
        uint256 currentAmount;
        bool finalized;
    }

    STeamToken public rewardToken;
    address public deployer;
    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public contributions;

    event CampaignCreated(uint256 indexed campaignId, address creator, string title, uint256 goal, uint256 deadline);
    event ContributionMade(uint256 indexed campaignId, address contributor, uint256 amount, uint256 fee);
    event CampaignFinalized(uint256 indexed campaignId, uint256 totalAmount, bool goalReached);

    constructor(address _rewardTokenAddress) Ownable(msg.sender) {
        rewardToken = STeamToken(payable(_rewardTokenAddress));
        deployer = msg.sender;
    }

    function createCampaign(string memory _title, uint256 _goal, uint256 _durationInDays) external {
        require(_goal > 0, "Goal must be > 0");
        require(_durationInDays > 0, "Duration must be > 0");

        uint256 campaignId = campaignCount++;
        campaigns[campaignId] = Campaign({
            creator: msg.sender,
            title: _title,
            goal: _goal,
            deadline: block.timestamp + (_durationInDays * 1 days),
            currentAmount: 0,
            finalized: false
        });

        emit CampaignCreated(campaignId, msg.sender, _title, _goal, campaigns[campaignId].deadline);
    }

    function contribute(uint256 _campaignId) external payable {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp < campaign.deadline, "Campaign ended");
        require(!campaign.finalized, "Campaign finalized");
        require(msg.value > 0, "Contribution must be > 0");

        uint256 fee = msg.value / 100; // 1% fee for deployer
        uint256 netContribution = msg.value - fee;

        // Send 1% fee to deployer
        (bool success, ) = payable(deployer).call{value: fee}("");
        require(success, "Fee transfer failed");

        campaign.currentAmount += netContribution;
        contributions[_campaignId][msg.sender] += netContribution;

        // Mint reward tokens proportional to contribution
        uint256 tokenAmount = (netContribution * 10**rewardToken.decimals()) / rewardToken.tokenPrice();
        rewardToken.mint(msg.sender, tokenAmount);

        emit ContributionMade(_campaignId, msg.sender, netContribution, fee);
    }

    function finalizeCampaign(uint256 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp >= campaign.deadline || campaign.currentAmount >= campaign.goal, "Cannot finalize yet");
        require(!campaign.finalized, "Already finalized");

        campaign.finalized = true;
        bool goalReached = campaign.currentAmount >= campaign.goal;

        if (goalReached) {
            (bool success, ) = payable(campaign.creator).call{value: campaign.currentAmount}("");
            require(success, "Transfer to creator failed");
        }

        emit CampaignFinalized(_campaignId, campaign.currentAmount, goalReached);
    }
}
