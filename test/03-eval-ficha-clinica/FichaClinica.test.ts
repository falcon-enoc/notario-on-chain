import { network } from "hardhat";
import { expect } from "chai";

const {ethers} = await network.connect();

describe("FichaClinica (Fase 1)", function () {
  async function deployFixture() {
    const [paciente, otroUsuario] = await ethers.getSigners();
    const FichaClinica = await ethers.getContractFactory("FichaClinica");
    const ficha = await FichaClinica.deploy();
    return { ficha, paciente, otroUsuario };
  }

  describe("Funcionalidad Basica", function () {
    it("Debe permitir a un paciente guardar sus datos y emitir evento", async function () {
      const { ficha, paciente } = await deployFixture();
      
      const condicion = "Gripe";
      const tratamiento = "Paracetamol";

      await expect(ficha.connect(paciente).actualizarFicha(condicion, tratamiento))
        .to.emit(ficha, "FichaActualizada")
        .withArgs(paciente.address, (val: any) => val > 0);
    });

    it("Debe recuperar los datos correctos del paciente", async function () {
      const { ficha, paciente } = await deployFixture();
      
      const condicion = "Alergia";
      const tratamiento = "Antihistaminico";

      await ficha.connect(paciente).actualizarFicha(condicion, tratamiento);

      const datos = await ficha.connect(paciente).consultarFicha();
      
      expect(datos.condicion).to.equal(condicion);
      expect(datos.tratamiento).to.equal(tratamiento);
    });

    it("Debe sobrescribir los datos si se actualiza nuevamente", async function () {
      const { ficha, paciente } = await deployFixture();
      
      await ficha.connect(paciente).actualizarFicha("Inicial", "Nada");
      await ficha.connect(paciente).actualizarFicha("Final", "Todo");

      const datos = await ficha.connect(paciente).consultarFicha();
      expect(datos.condicion).to.equal("Final");
      expect(datos.tratamiento).to.equal("Todo");
    });

    it("No debe permitir consultar si no hay datos", async function () {
      const { ficha, paciente } = await deployFixture();
      await expect(ficha.connect(paciente).consultarFicha()).to.be.revertedWith("No existe ficha clinica para este usuario");
    });

    it("Cada usuario debe tener su propia ficha independiente", async function () {
        const { ficha, paciente, otroUsuario } = await deployFixture();
        
        await ficha.connect(paciente).actualizarFicha("Paciente", "A");
        await ficha.connect(otroUsuario).actualizarFicha("Otro", "B");
  
        const datosPaciente = await ficha.connect(paciente).consultarFicha();
        const datosOtro = await ficha.connect(otroUsuario).consultarFicha();
  
        expect(datosPaciente.condicion).to.equal("Paciente");
        expect(datosOtro.condicion).to.equal("Otro");
      });
  });
});
