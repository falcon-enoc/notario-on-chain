import { network } from "hardhat";
import { expect } from "chai";

const {ethers} = await network.connect();

describe("HolaMundo", function () {
  it("Should deploy HolaMundo contract", async function () {
    const c = await ethers.deployContract("HolaMundo", ["Hola tierra"]);
    const saludo = await c.getSaludo();
    expect(saludo).to.equal("Hola tierra");
  })

  it("Should deploy HolaMundo con una cadena vacia", async function () {
    const c = await ethers.deployContract("HolaMundo", ["Hola tierra"]);
    const tx = await c.setSaludo("");
    await tx.wait();
    const saludo = await c.getSaludo();
    expect(saludo).to.equal("");
  })
});
