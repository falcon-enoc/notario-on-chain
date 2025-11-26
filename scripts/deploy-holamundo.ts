import {network} from "hardhat";

const {ethers} = await network.connect();

async function main() {
  console.log("Deploying HolaMundo contract...");
  const net = await ethers.provider.getNetwork();
  console.log("Network:", net.name, `(chainId: ${net.chainId})`);

  const contract = await ethers.deployContract("HolaMundo", ["Hola mundo"]);
  await contract.waitForDeployment();


  // Guardamos direccion para no tener que volver a desplegar el contrato

  const address = await contract.getAddress();
  console.log("HolaMundo deployed to:", address);

  
  console.log("Done.");

  console.log("Saludo inicial:", await contract.getSaludo());
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});