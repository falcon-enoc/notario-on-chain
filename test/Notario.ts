import { network } from "hardhat";  
import { expect } from "chai";

const {ethers} = require("hardhat");

const h = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));

describe("Notario", function () {
  it("Debe registrar un documento", async function () {
    const notario = await ethers.deployContract("Notario");
    const hashDoc = h("documento1");
    
    await notario.registrar(hashDoc);
    
    expect(await notario.existe(hashDoc)).to.be.true;
  });

  it("No debe permitir registrar el mismo documento dos veces", async function () {
    const notario = await ethers.deployContract("Notario");
    const hashDoc = h("documento2");
    
    await notario.registrar(hashDoc);
    
    await expect(notario.registrar(hashDoc))
      .to.be.revertedWith("Documento ya registrado");
  });

  it("Debe obtener información del documento", async function () {
    const notario = await ethers.deployContract("Notario");
    const [owner] = await ethers.getSigners();
    const hashDoc = h("documento3");
    
    await notario.registrar(hashDoc);
    const [autor, registradoEn, revocadoEn] = await notario.obtener(hashDoc);
    
    expect(autor).to.equal(await owner.getAddress());
    expect(registradoEn).to.be.greaterThan(0);
    expect(revocadoEn).to.equal(0);
  });

  it("Debe revocar un documento", async function () {
    const notario = await ethers.deployContract("Notario");
    const hashDoc = h("documento4");
    
    await notario.registrar(hashDoc);
    await notario.revocar(hashDoc);
    
    expect(await notario.existe(hashDoc)).to.be.false;
  });

  it("Solo el autor puede revocar", async function () {
    const notario = await ethers.deployContract("Notario");
    const [owner, addr1] = await ethers.getSigners();
    const hashDoc = h("documento5");
    
    await notario.connect(owner).registrar(hashDoc);
    
    await expect(notario.connect(addr1).revocar(hashDoc))
      .to.be.revertedWith("Solo el autor puede revocar");
  });
});