import dotenv from "dotenv";
dotenv.config();

import { ethers } from "hardhat";

const h = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));

const formatTimestamp = (ts: bigint): string => {
  if (ts === 0n) return "N/A";
  return new Date(Number(ts) * 1000).toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};

async function main() {
  const contractAddress = process.env.NOTARIO_ADDRESS;
  
  if (!contractAddress) {
    throw new Error("NOTARIO_ADDRESS no está definida en .env");
  }

  console.log("Conectando al contrato Notario en:", contractAddress);
  
  const notario = await ethers.getContractAt("Notario", contractAddress);
  const [signer] = await ethers.getSigners();
  
  console.log("Cuenta activa:", await signer.getAddress());
  console.log("\n--- DEMO Notario ---\n");

  // 1. Registrar un documento
  const doc1 = h("Contrato de compraventa 2024");
  // 3. Obtener información
  console.log("\n3. Obteniendo información...");
  const [autor, registradoEn, revocadoEn] = await notario.obtener(doc1);
  console.log("   Autor:", autor);
  console.log("   Registrado en:", formatTimestamp(registradoEn));
  console.log("   Revocado:", revocadoEn > 0 ? "Sí" : "No");

  // 2. Verificar existencia
  console.log("\n2. Verificando existencia...");
  const existe = await notario.existe(doc1);
  console.log("   Existe:", existe);

  // 3. Obtener información
  console.log("\n3. Obteniendo información...");
  const [autor, registradoEn, revocadoEn] = await notario.obtener(doc1);
  console.log("   Autor:", autor);
  console.log("   Registrado en:", new Date(Number(registradoEn) * 1000).toLocaleString());
  console.log("   Revocado:", revocadoEn > 0 ? "Sí" : "No");

  // 4. Registrar otro documento
  const doc2 = h("Acta de reunión 15/12/2024");
  console.log("\n4. Registrando segundo documento...");
  console.log("   Hash:", doc2);
  
  const tx2 = await notario.registrar(doc2);
  await tx2.wait();
  console.log("   ✓ Documento registrado");

  // 5. Revocar el primer documento
  console.log("\n5. Revocando primer documento...");
  const tx3 = await notario.revocar(doc1);
  await tx3.wait();
  console.log("   ✓ Documento revocado");

  // 6. Verificar estado después de revocar
  console.log("\n6. Verificando estado después de revocar...");
  const existeDespues = await notario.existe(doc1);
  console.log("   Existe:", existeDespues);
  
  const [, , revocadoEnFinal] = await notario.obtener(doc1);
  console.log("   Revocado en:", formatTimestamp(revocadoEnFinal));

  console.log("\n--- FIN DEMO ---");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
