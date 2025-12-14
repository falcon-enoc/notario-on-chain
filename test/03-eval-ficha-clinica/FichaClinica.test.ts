import { network } from "hardhat";
import { expect } from "chai";

const {ethers} = await network.connect();

describe("FichaClinica", function () {
  async function deployFixture() {
    const [paciente, medicoAutorizado, medicoNoAutorizado] = await ethers.getSigners();
    const FichaClinica = await ethers.getContractFactory("FichaClinica");
    const ficha = await FichaClinica.deploy();
    return { ficha, paciente, medicoAutorizado, medicoNoAutorizado };
  }

  describe("Fase 1: Funcionalidad Basica", function () {
    it("Debe permitir a un paciente crear su ficha (datos inmutables y contacto)", async function () {
      const { ficha, paciente } = await deployFixture();
      
      const tipoSangre = "O+";
      const fechaNacimiento = 946684800; // 1 de Enero de 2000
      const direccion = "Calle 123";
      const telefono = "555-1234";

      await expect(ficha.connect(paciente).crearFicha(tipoSangre, fechaNacimiento, direccion, telefono))
        .to.emit(ficha, "FichaCreada")
        .withArgs(paciente.address, (val: any) => val > 0);
    });

    it("Debe permitir agregar diagnosticos al historial", async function () {
      const { ficha, paciente } = await deployFixture();
      
      // 1. Crear ficha
      await ficha.connect(paciente).crearFicha("O+", 946684800, "Calle 123", "555-1234");

      // 2. Agregar diagnostico
      const descripcion = "Gripe";
      const tratamiento = "Paracetamol";
      
      await expect(ficha.connect(paciente).agregarDiagnostico(paciente.address, descripcion, tratamiento))
        .to.emit(ficha, "NuevoDiagnostico")
        .withArgs(paciente.address, paciente.address, descripcion, (val: any) => val > 0);
    });

    it("Debe recuperar el historial y datos de contacto correctamente", async function () {
      const { ficha, paciente } = await deployFixture();
      
      await ficha.connect(paciente).crearFicha("O+", 946684800, "Calle 123", "555-1234");
      await ficha.connect(paciente).agregarDiagnostico(paciente.address, "Diag 1", "Trat 1");
      await ficha.connect(paciente).agregarDiagnostico(paciente.address, "Diag 2", "Trat 2");

      const datos = await ficha.connect(paciente).consultarFicha.staticCall(paciente.address);
      
      expect(datos.tipoSangre).to.equal("O+");
      expect(datos.direccion).to.equal("Calle 123");
      expect(datos.telefono).to.equal("555-1234");
      expect(datos.historial.length).to.equal(2);
      expect(datos.historial[0].descripcion).to.equal("Diag 1");
      expect(datos.historial[1].descripcion).to.equal("Diag 2");
    });

    it("No debe permitir crear ficha si ya existe", async function () {
        const { ficha, paciente } = await deployFixture();
        await ficha.connect(paciente).crearFicha("O+", 1, "Dir", "Tel");
        
        await expect(ficha.connect(paciente).crearFicha("O+", 1, "Dir", "Tel"))
            .to.be.revertedWith("La ficha ya existe.");
    });

    it("No debe permitir modificar datos vitales (intentando crear ficha de nuevo)", async function () {
        const { ficha, paciente } = await deployFixture();
        
        // 1. Crear ficha con datos originales
        await ficha.connect(paciente).crearFicha("O+", 946684800, "Dir", "Tel");
        
        // 2. Intentar "sobrescribir" con nuevos datos vitales
        await expect(ficha.connect(paciente).crearFicha("AB-", 999999999, "Dir2", "Tel2"))
            .to.be.revertedWith("La ficha ya existe.");
            
        // 3. Verificar que los datos originales se mantienen
        const datos = await ficha.connect(paciente).consultarFicha.staticCall(paciente.address);
        expect(datos.tipoSangre).to.equal("O+");
        expect(datos.fechaNacimiento).to.equal(946684800);
    });

    it("No debe permitir agregar diagnostico si no existe ficha", async function () {
        const { ficha, paciente } = await deployFixture();
        await expect(ficha.connect(paciente).agregarDiagnostico(paciente.address, "A", "B"))
            .to.be.revertedWith("El paciente no tiene ficha.");
    });
  });

  describe("Fase 2: Logica de Negocio y Autorizacion", function () {
    it("Medico autorizado debe poder agregar diagnosticos", async function () {
        const { ficha, paciente, medicoAutorizado } = await deployFixture();
        
        await ficha.connect(paciente).crearFicha("O+", 100, "Dir", "Tel");
        await ficha.connect(paciente).autorizarMedico(medicoAutorizado.address, 3600);

        await expect(ficha.connect(medicoAutorizado).agregarDiagnostico(paciente.address, "Fractura", "Yeso"))
            .to.emit(ficha, "NuevoDiagnostico")
            .withArgs(paciente.address, medicoAutorizado.address, "Fractura", (val: any) => val > 0);
        
        const datos = await ficha.connect(paciente).consultarFicha.staticCall(paciente.address);
        expect(datos.historial[0].doctor).to.equal(medicoAutorizado.address);
    });

    it("Medico NO autorizado NO debe poder agregar diagnosticos", async function () {
        const { ficha, paciente, medicoNoAutorizado } = await deployFixture();
        
        await ficha.connect(paciente).crearFicha("O+", 100, "Dir", "Tel");

        await expect(ficha.connect(medicoNoAutorizado).agregarDiagnostico(paciente.address, "Intruso", "Mal"))
            .to.be.revertedWith("No tiene permiso para agregar diagnosticos.");
    });

    it("Medico NO autorizado NO debe poder consultar ficha (Privacidad)", async function () {
        const { ficha, paciente, medicoNoAutorizado } = await deployFixture();
        
        await ficha.connect(paciente).crearFicha("O+", 100, "Dir", "Tel");

        await expect(ficha.connect(medicoNoAutorizado).consultarFicha(paciente.address))
            .to.be.revertedWith("Acceso denegado");
    });

    it("Test E: Paciente autoriza a Medico y este consulta con exito (y genera log)", async function () {
        const { ficha, paciente, medicoAutorizado } = await deployFixture();
        
        await ficha.connect(paciente).crearFicha("O+", 100, "Dir", "Tel");
        await ficha.connect(paciente).autorizarMedico(medicoAutorizado.address, 3600);

        // Medico consulta
        await expect(ficha.connect(medicoAutorizado).consultarFicha(paciente.address))
            .to.emit(ficha, "VisitaRegistrada");
        
        // Verificar historial
        const historial = await ficha.connect(paciente).verHistorialAccesos();
        expect(historial.length).to.equal(1);
        expect(historial[0].visitante).to.equal(medicoAutorizado.address);
    });
  });

  describe("Fase 3: Datos de Contacto Mutables", function () {
    it("Debe permitir al paciente actualizar sus datos de contacto", async function () {
        const { ficha, paciente } = await deployFixture();
        
        await ficha.connect(paciente).crearFicha("O+", 100, "Calle Vieja", "111-1111");
        
        await expect(ficha.connect(paciente).actualizarContacto("Calle Nueva", "222-2222"))
            .to.emit(ficha, "DatosContactoActualizados")
            .withArgs(paciente.address, "Calle Nueva", "222-2222", (val: any) => val > 0);
            
        const datos = await ficha.connect(paciente).consultarFicha.staticCall(paciente.address);
        expect(datos.direccion).to.equal("Calle Nueva");
        expect(datos.telefono).to.equal("222-2222");
        // Verificar que los datos inmutables no cambiaron
        expect(datos.tipoSangre).to.equal("O+");
    });

    it("No debe permitir a otros actualizar los datos de contacto del paciente", async function () {
        const { ficha, paciente, medicoAutorizado } = await deployFixture();
        
        await ficha.connect(paciente).crearFicha("O+", 100, "Calle Vieja", "111-1111");
        
        // El medico intenta actualizar "su" contacto, pero como no tiene ficha, falla con "La ficha no existe."
        // Esto confirma implícitamente que no está accediendo a la ficha del paciente, 
        // ya que la función usa msg.sender.
        await expect(ficha.connect(medicoAutorizado).actualizarContacto("Calle Hack", "000-0000"))
            .to.be.revertedWith("La ficha no existe.");
    });
  });
});
