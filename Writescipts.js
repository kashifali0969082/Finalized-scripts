require("dotenv").config();
const { RegistrationData,LevelsTable } = require("./Database.js");
const { TestingWriteAdress, TestingWriteAbi, TestingWriteLvlAddress, TestingWriteLvlAbi } = require("./exports");
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");
const sepoliaprovider = new ethers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/rKshm4YiwRaokisumjlrGg2ekolHzkNT");

const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  throw new Error("Missing PRIVATE_KEY in .env");
}
const signer = new ethers.Wallet(privateKey, sepoliaprovider);
const contract = new ethers.Contract(
  TestingWriteAdress,
  TestingWriteAbi,
  signer
);
const LevelContract = new ethers.Contract(
  TestingWriteLvlAddress,
  TestingWriteLvlAbi,
  signer
);

const BATCH_SIZE = 10;
async function writeToContract() {
  try {
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const entries = await RegistrationData.find()
        .skip(skip)
        .limit(BATCH_SIZE);
      console.log(`Fetched ${entries.length} entries from DB`);

      if (entries.length === 0) {
        hasMore = false;
        break;
      }

      const finalUsersArray = entries.map((entry) => [
        entry.userAddress,
        entry.name,
        entry.uplineId,
        entry.userId,
        entry.imgURL,
        String(entry.joiningDate),
        String(entry.countId),
        String(entry.uplineCountID),
        entry.uplineAddress,
        entry.directDownlines || [],
      ]);

      console.log("→ Batch processed:", finalUsersArray);

      const tx = await contract.transferUsers(finalUsersArray);
      console.log("Transaction sent. Hash:", tx.hash);
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        console.log("✅ Transaction confirmed! Block:", receipt.blockNumber);
      } 

      skip += BATCH_SIZE;
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}
async function WriteToLevelContract(){
  try {
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const entries = await LevelsTable.find()
        .skip(skip)
        .limit(BATCH_SIZE);
      console.log(`Fetched ${entries.length} entries from DB`);

      if (entries.length === 0) {
        hasMore = false;
        break;
      }

      const finalUsersArray = entries.map((entry) => [
        entry.userAddress,
        String(entry.team_Id),
        entry.totalIncome,
        entry.totalVirtualIncome,
        String(entry.transactionCount),
        String(entry.totalDirect),
        String(entry.lastUpdate),
        String(entry.currentUserLevel),
       String( entry.firstActivationDate),
        entry.virtualUpline,
        entry.virtualDirects || [],
        String(entry.virtualId),
       String(entry.isActive),
       (entry.history || [])
       .sort((a, b) => Number(b[3]) - Number(a[3]))
       .slice(0, 5)
       .map(h => [
         h[0],
         h[1], 
         h[2],
         h[3]                           
       ]),  
      ]);

      console.log("--------------------",finalUsersArray);
      const tx = await LevelContract.transferUsers(finalUsersArray);
      console.log("Transaction sent. Hash:", tx.hash);
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        console.log("✅ Transaction confirmed! Block:", receipt.blockNumber);
      } 

    

      skip += BATCH_SIZE;
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
  
}
module.exports = { writeToContract,WriteToLevelContract };
