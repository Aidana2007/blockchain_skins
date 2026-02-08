// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./SteamToken.sol";
contract Crowdfunding {
    SteamToken public steamToken;
    address public platformOwner;
    uint256 public platformFeePercent = 5; 
    uint256 public campaignCount;
    uint256 public constant TOKEN_REWARD_RATIO = 1000;
    struct Campaign {
        string title;
        uint256 goal;           
        uint256 deadline;       
        uint256 amountRaised;   
        address creator;        
        bool finalized;         
        bool cancelled;         
    }
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    event CampaignCreated(
        uint256 indexed campaignId,
        string title,
        uint256 goal,
        uint256 deadline,
        address indexed creator
    );
    event CampaignFunded(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount,
        uint256 tokensRewarded
    );
    event CampaignFinalized(
        uint256 indexed campaignId,
        uint256 totalRaised,
        uint256 creatorAmount,
        uint256 platformFee
    );
    event CampaignCancelled(uint256 indexed campaignId);
    constructor(address _tokenAddress) {
        require(_tokenAddress != address(0), "Invalid token address");
        steamToken = SteamToken(_tokenAddress);
        platformOwner = msg.sender;
    }
    function createCampaign(
        string memory _title,
        uint256 _goal,
        uint256 _durationInDays
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_goal > 0, "Goal must be greater than zero");
        require(_durationInDays > 0 && _durationInDays <= 90, "Duration must be 1-90 days");
        campaignCount++;
        uint256 deadline = block.timestamp + (_durationInDays * 1 days);
        campaigns[campaignCount] = Campaign({
            title: _title,
            goal: _goal,
            deadline: deadline,
            amountRaised: 0,
            creator: msg.sender,
            finalized: false,
            cancelled: false
        });
        emit CampaignCreated(campaignCount, _title, _goal, deadline, msg.sender);
        return campaignCount;
    }
    function fundCampaign(uint256 _campaignId) external payable {
        Campaign storage campaign = campaigns[_campaignId];
        require(_campaignId > 0 && _campaignId <= campaignCount, "Invalid campaign ID");
        require(block.timestamp < campaign.deadline, "Campaign has ended");
        require(!campaign.finalized, "Campaign already finalized");
        require(!campaign.cancelled, "Campaign was cancelled");
        require(msg.value > 0, "Must send ETH");
        require(msg.sender != campaign.creator, "Creator cannot fund own campaign");
        campaign.amountRaised += msg.value;
        contributions[_campaignId][msg.sender] += msg.value;
        uint256 tokenReward = msg.value * TOKEN_REWARD_RATIO;
        steamToken.mint(msg.sender, tokenReward);
        emit CampaignFunded(_campaignId, msg.sender, msg.value, tokenReward);
    }
    function finalizeCampaign(uint256 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];
        require(_campaignId > 0 && _campaignId <= campaignCount, "Invalid campaign ID");
        require(block.timestamp >= campaign.deadline, "Campaign not ended yet");
        require(!campaign.finalized, "Already finalized");
        require(!campaign.cancelled, "Campaign was cancelled");
        require(campaign.amountRaised > 0, "No funds to distribute");
        campaign.finalized = true;
        uint256 platformFee = (campaign.amountRaised * platformFeePercent) / 100;
        uint256 creatorAmount = campaign.amountRaised - platformFee;
        (bool feeSuccess, ) = payable(platformOwner).call{value: platformFee}("");
        require(feeSuccess, "Platform fee transfer failed");
        (bool creatorSuccess, ) = payable(campaign.creator).call{value: creatorAmount}("");
        require(creatorSuccess, "Creator payment failed");
        emit CampaignFinalized(_campaignId, campaign.amountRaised, creatorAmount, platformFee);
    }
    function getCampaign(uint256 _campaignId) external view returns (
        string memory title,
        uint256 goal,
        uint256 deadline,
        uint256 amountRaised,
        address creator,
        bool finalized,
        bool cancelled
    ) {
        Campaign storage campaign = campaigns[_campaignId];
        return (
            campaign.title,
            campaign.goal,
            campaign.deadline,
            campaign.amountRaised,
            campaign.creator,
            campaign.finalized,
            campaign.cancelled
        );
    }
    function getContribution(uint256 _campaignId, address _contributor) 
        external 
        view 
        returns (uint256) 
    {
        return contributions[_campaignId][_contributor];
    }
    function isCampaignActive(uint256 _campaignId) external view returns (bool) {
        Campaign storage campaign = campaigns[_campaignId];
        return block.timestamp < campaign.deadline && 
               !campaign.finalized && 
               !campaign.cancelled;
    }
    function setPlatformFee(uint256 _newFeePercent) external {
        require(msg.sender == platformOwner, "Only owner can set fee");
        require(_newFeePercent <= 10, "Fee cannot exceed 10%");
        platformFeePercent = _newFeePercent;
    }
    function getAllCampaignIds() external view returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](campaignCount);
        for (uint256 i = 1; i <= campaignCount; i++) {
            ids[i - 1] = i;
        }
        return ids;
    }
    receive() external payable {
        revert("Use fundCampaign() to contribute");
    }
}