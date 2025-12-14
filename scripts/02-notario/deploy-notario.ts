import {network} from "hardhat";

const {ethers} = await network.connect();

async function main() {
  console.log("Deploying Notario contract...");
  const net = await ethers.provider.getNetwork();
  console.log("Network:", net.name, `(chainId: ${net.chainId})`);

  const contract = await ethers.deployContract("Notario");
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("Notario deployed to:", address);

  // Sanity check: registrar un documento de prueba
  const testHash = ethers.keccak256(ethers.toUtf8Bytes("documento de prueba"));
  console.log("\nSanity check - Hash del documento:", testHash);
  
  const tx = await contract.registrar(testHash);
  await tx.wait();
  console.log("Documento registrado correctamente");
  
  const existe = await contract.existe(testHash);
  console.log("El documento existe:", existe);

  console.log("\nDone.");
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
