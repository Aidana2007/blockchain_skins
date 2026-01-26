const { ethers } = require("hardhat");

async function main() {
  const [owner, user1, user2, user3] = await ethers.getSigners();

  const Voting = await ethers.getContractFactory("SimpleVoting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();

  console.log("SimpleVoting deployed to:", await voting.getAddress());

  // 1) add candidates (owner)
  await (await voting.addCandidate("Alice")).wait();
  await (await voting.addCandidate("Bob")).wait();
  console.log("Candidates added: Alice, Bob");

  // 2) users vote
  await (await voting.connect(user1).vote(0)).wait(); // Alice
  await (await voting.connect(user2).vote(1)).wait(); // Bob
  await (await voting.connect(user3).vote(0)).wait(); // Alice
  console.log("Votes cast: user1->Alice, user2->Bob, user3->Alice");

  // 3) show results
  const [name0, votes0] = await voting.getCandidate(0);
  const [name1, votes1] = await voting.getCandidate(1);

  console.log("RESULTS:");
  console.log(name0, "votes =", votes0.toString());
  console.log(name1, "votes =", votes1.toString());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
