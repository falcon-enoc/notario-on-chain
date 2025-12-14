import { network } from "hardhat";

const {ethers} = await network.connect();

async function main() {
  console.log("Iniciando despliegue de FichaClinica...");

  const FichaClinica = await ethers.getContractFactory("FichaClinica");
  const ficha = await FichaClinica.deploy();

  await ficha.waitForDeployment();

  const address = await ficha.getAddress();
  console.log(`FichaClinica desplegada en: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
