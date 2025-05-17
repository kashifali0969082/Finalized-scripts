const { ethers } = require("ethers");
const {
  registrationContract,
  registrationContractAbi,
  UserContract,
  UserContractAbi,
  Level10Contract,
  Level10ContractAbi,
} = require("./exports");
const { RegistrationData, LevelsTable } = require("./Database");
const provider = new ethers.JsonRpcProvider("https://rpc.soniclabs.com");
const contract = new ethers.Contract(
  registrationContract,
  registrationContractAbi,
  provider
);
const Sonic = new ethers.Contract(UserContract, UserContractAbi, provider);


async function Registration() {
  try {
    console.log("registration function is working");
    const userData = await contract.lastUserId();
    console.log("data from last user id is", Number(userData));
    for (let i = 1; i <= Number(userData); i++) {
      const userAddress = await contract.countIdToAddress(i);
      const userData = await contract.users(userAddress);
      const userUpline = await contract.userUpline(userAddress);
      // const userid = await contract.countIdToAddress(userAddress);

      const downLinersCount = await contract.directDownlinesCount(userAddress);
      let downLiners = [];
      for (let i = 0; i < Number(downLinersCount); i++) {
        const downLinersAddress = await contract.directDownlines(
          userAddress,
          i
        );
        downLiners.push(downLinersAddress);
      }
      const userDocument = {
        userAddress: userAddress,
        name: userData[0],
        uplineId: userData[1],
        userId: userData[2],
        imgURL: userData[3],
        joiningDate: Number(userData[4]),
        countId: Number(userData[5]),
        uplineCountID: Number(userData[6]),
        uplineAddress: userUpline,
        directDownlines: downLiners,
      };
      await RegistrationData.create(userDocument);

      console.log("docs = ", userDocument);
    }
  } catch (error) {
    console.log("error whil getting data from blockchain", error);
  }
}

// async function LevelsScripts() {
//   try {
//     const cursor = RegistrationData.find(
//       {},
//       { userAddress: 1, _id: 0 }
//     ).lean().exec();; // Fetch only `userAddress`
//     for await (let doc of cursor) {
//       console.log("User Address:", doc.userAddress);
//       const userData = await Sonic.users(doc.userAddress);
//       const virtuallUpline = await Sonic.virtualUplineOf(doc.userAddress);
//       const virtuallIds = await Sonic.virtualIds(doc.userAddress);
//       const isactive = await Sonic.isActive(doc.userAddress);
//       const stories = await Sonic.getStories(doc.userAddress);
//       const VirtualDirect = await Sonic.totalVirtualDirect(doc.userAddress);

//       console.log("user data = ", stories);
//       let virtualDirectsArr = [];

//       for (let i = 0; i < Number(VirtualDirect); i++) {
//         const data = await Sonic.virtualDirectsOf(doc.userAddress, i);
//         console.log(i, "------", data);
//         virtualDirectsArr.push(data);
//       }
//       const lvlEntry = new LevelsTable({
//         userAddress: doc.userAddress,
//         team_Id: Number(userData[1]),
//         totalIncome: String(userData[2]),
//         totalVirtualIncome: String(userData[3]),
//         transactionCount: Number(userData[4]),
//         totalDirect: Number(userData[5]),
//         lastUpdate: Number(userData[6]),
//         currentUserLevel: Number(userData[7]),
//         firstActivationDate: Number(userData[8]),
//         virtualUpline: virtuallUpline,
//         virtualDirects: virtualDirectsArr,
//         virtualId: Number(virtuallIds),
//         isActive: isactive,
//         history: stories.map((entry) => [
//           String(entry[0]),
//           String(entry[1]),
//           String(entry[2]),
//           String(entry[3]),
//         ]),
//       });
//       await lvlEntry.save();
//       console.log("Data saved for user:", lvlEntry);
//     }
//   } catch (error) {
//     console.log("error while getting levels data ", error);
//   }
// }
async function LevelsScripts() {
  try {
    const users = await RegistrationData.find({}, { userAddress: 1, _id: 0 }).lean().exec();

    for (const doc of users) {
      try {
        console.log("User Address:", doc.userAddress);
        const userData = await Sonic.users(doc.userAddress);
        const virtuallUpline = await Sonic.virtualUplineOf(doc.userAddress);
        const virtuallIds = await Sonic.virtualIds(doc.userAddress);
        const isactive = await Sonic.isActive(doc.userAddress);
        const stories = await Sonic.getStories(doc.userAddress);
        const VirtualDirect = await Sonic.totalVirtualDirect(doc.userAddress);

        let virtualDirectsArr = [];

        for (let i = 0; i < Number(VirtualDirect); i++) {
          const data = await Sonic.virtualDirectsOf(doc.userAddress, i);
          console.log(i, "------", data);
          virtualDirectsArr.push(data);
        }

        const lvlEntry = new LevelsTable({
          userAddress: doc.userAddress,
          team_Id: Number(userData[1]),
          totalIncome: String(userData[2]),
          totalVirtualIncome: String(userData[3]),
          transactionCount: Number(userData[4]),
          totalDirect: Number(userData[5]),
          lastUpdate: Number(userData[6]),
          currentUserLevel: Number(userData[7]),
          firstActivationDate: Number(userData[8]),
          virtualUpline: virtuallUpline,
          virtualDirects: virtualDirectsArr,
          virtualId: Number(virtuallIds),
          isActive: isactive,
          history: stories.map((entry) => [
            String(entry[0]),
            String(entry[1]),
            String(entry[2]),
            String(entry[3]),
          ]),
        });

        await lvlEntry.save();
        console.log("Data saved for user:", doc.userAddress);
      } catch (innerErr) {
        console.error("Error for user", doc.userAddress, innerErr);
      }
    }
  } catch (error) {
    console.log("error while getting levels data ", error);
  }
}



module.exports = { Registration, LevelsScripts };
