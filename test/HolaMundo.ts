import { network } from "hardhat";
import { expect } from "chai";

const {ethers} = await network.connect();

describe("HolaMundo", function () {
  it("Should deploy HolaMundo contract", async function () {
    const c = await ethers.deployContract("HolaMundo");
    const saludo = await c.getSaludo();
    expect(saludo).to.equal("Hola Mundo");
  })
});
