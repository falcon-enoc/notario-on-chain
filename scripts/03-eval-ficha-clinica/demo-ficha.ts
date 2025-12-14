import { network } from "hardhat";

const {ethers} = await network.connect();

// Direcciones predeterminadas de Hardhat (Account 0 se usa para Deployer)
// Usamos desde la Account 1 en adelante para los roles de usuario
const PACIENTE_1_ADDR = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"; // Account 1
const PACIENTE_2_ADDR = "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc"; // Account 2
const DOCTOR_AUTORIZADO_ADDR = "0x90f79bf6eb2c4f870365e785982e1f101e93b906"; // Account 3
const DOCTOR_NO_AUTORIZADO_ADDR = "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65"; // Account 4

async function main() {
  console.log("--- INICIO DEMO FICHA CLINICA (Historial de Diagnosticos) ---");

  // 0. Inicialización
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer (Admin): ${deployer.address}`);

  const paciente1 = await ethers.getSigner(PACIENTE_1_ADDR);
  const paciente2 = await ethers.getSigner(PACIENTE_2_ADDR);
  const doctorAutorizado = await ethers.getSigner(DOCTOR_AUTORIZADO_ADDR);
  const doctorNoAutorizado = await ethers.getSigner(DOCTOR_NO_AUTORIZADO_ADDR);

  const FichaClinica = await ethers.getContractFactory("FichaClinica");
  const ficha = await FichaClinica.connect(deployer).deploy();
  await ficha.waitForDeployment();
  console.log(`\nContrato desplegado en: ${await ficha.getAddress()}\n`);

  // Paso 1: Pacientes crean su ficha (Datos Inmutables)
  console.log("--- Paso 1: Creacion de Fichas (Datos Inmutables) ---");
  
  await ficha.connect(paciente1).crearFicha("O+", 946684800, "Calle 1", "111-1111");
  console.log("Paciente 1 creo su ficha (O+, 01/01/2000, Calle 1, 111-1111).");

  await ficha.connect(paciente2).crearFicha("A-", 978307200, "Calle 2", "222-2222");
  console.log("Paciente 2 creo su ficha (A-, 01/01/2001, Calle 2, 222-2222).\n");

  // Paso 2: Paciente 1 agrega un diagnostico inicial
  console.log("--- Paso 2: Paciente 1 agrega diagnostico inicial ---");
  await ficha.connect(paciente1).agregarDiagnostico(paciente1.address, "Gripe Leve", "Te y Reposo");
  console.log("Diagnostico agregado por Paciente 1.\n");

  // Paso 2.1: Prueba de Seguridad (Paciente 2 intenta leer Paciente 1)
  console.log("--- Paso 2.1: Prueba de Seguridad (Paciente 2 intenta leer Paciente 1) ---");
  try {
    await ficha.connect(paciente2).consultarFicha(paciente1.address);
  } catch (error: any) {
    console.log(`Error esperado capturado: ${error.reason || error.message}`);
    console.log("-> Paciente 2 NO PUEDE leer la ficha de Paciente 1 (Correcto).\n");
  }

  // Paso 2.2: Prueba de Seguridad (Doctor No Autorizado intenta leer)
  console.log(`--- Paso 2.2: Doctor No Autorizado (${doctorNoAutorizado.address}) intenta leer ---`);
  try {
    await ficha.connect(doctorNoAutorizado).consultarFicha(paciente1.address);
  } catch (error: any) {
    console.log(`Error esperado capturado: ${error.reason || error.message}`);
    console.log("-> Doctor No Autorizado bloqueado correctamente.\n");
  }

  // Paso 3: Paciente 1 actualiza sus datos de contacto
  console.log("\n--- Paso 3: Paciente 1 actualiza sus datos de contacto ---");
  
  // Consultar estado actual antes del cambio
  const datosAntes = await ficha.connect(paciente1).consultarFicha.staticCall(paciente1.address);
  console.log(`[Estado Actual] Direccion: ${datosAntes.direccion} | Telefono: ${datosAntes.telefono}`);

  console.log("... Ejecutando actualizacion ...");
  await ficha.connect(paciente1).actualizarContacto("Avenida Siempre Viva 742", "555-9999");
  
  const datosDespues = await ficha.connect(paciente1).consultarFicha.staticCall(paciente1.address);
  console.log(`[Nuevo Estado]  Direccion: ${datosDespues.direccion} | Telefono: ${datosDespues.telefono}`);
  console.log("-> Datos actualizados correctamente.\n");

  // Paso 4: Paciente 1 autoriza al Doctor
  console.log(`--- Paso 4: Paciente 1 autoriza al Doctor Autorizado (${doctorAutorizado.address}) (60s) ---`);
  const tx = await ficha.connect(paciente1).autorizarMedico(doctorAutorizado.address, 60);
  await tx.wait();
  console.log("Autorizacion otorgada.\n");

  // Paso 5: Doctor Autorizado agrega un nuevo diagnostico
  console.log(`--- Paso 5: Doctor Autorizado (${doctorAutorizado.address}) agrega diagnostico a Paciente 1 ---`);
  await ficha.connect(doctorAutorizado).agregarDiagnostico(paciente1.address, "Neumonia", "Antibioticos y Hospitalizacion");
  console.log("Diagnostico agregado por Doctor Autorizado.\n");

  // Paso 6: Doctor Autorizado consulta el historial completo
  console.log("--- Paso 6: Doctor Autorizado consulta historial de Paciente 1 ---");
  
  const datos = await ficha.connect(doctorAutorizado).consultarFicha.staticCall(paciente1.address);
  console.log("Datos recuperados exitosamente:");
  console.log(`- Tipo Sangre: ${datos.tipoSangre}`);
  console.log(`- Fecha Nacimiento: ${datos.fechaNacimiento}`);
  console.log(`- Direccion: ${datos.direccion}`);
  console.log(`- Telefono: ${datos.telefono}`);
  console.log(`- Cantidad de Diagnosticos: ${datos.historial.length}`);
  
  console.log("\n--- Detalle del Historial ---");
  datos.historial.forEach((diag: any, index: number) => {
      console.log(`[Diagnostico #${index + 1}]`);
      console.log(`  Descripcion: ${diag.descripcion}`);
      console.log(`  Tratamiento: ${diag.tratamiento}`);
      const nombreAutor = diag.doctor === doctorAutorizado.address ? "Doctor Autorizado" : (diag.doctor === paciente1.address ? "Paciente 1" : "Desconocido");
      console.log(`  Autor: ${nombreAutor} (${diag.doctor})`);
      console.log(`  Fecha: ${diag.fecha}`);
  });
  console.log("\n");

  // Paso 7: Verificar Log de Accesos (Auditoria)
  console.log("--- Paso 7: Paciente 1 verifica quien vio su ficha ---");
  // Nota: consultarFicha.staticCall no genera log, pero si hacemos una llamada real sí.
  // Vamos a hacer una llamada real de consulta para generar el log.
  await ficha.connect(doctorAutorizado).consultarFicha(paciente1.address);

  const historial = await ficha.connect(paciente1).verHistorialAccesos();
  console.log(`Total de visitas registradas: ${historial.length}`);
  if (historial.length > 0) {
      const visitante = historial[historial.length - 1].visitante;
      const nombreVisitante = visitante === doctorAutorizado.address ? "Doctor Autorizado" : (visitante === paciente1.address ? "Paciente 1" : "Otro");
      console.log(`Ultima visita por: ${nombreVisitante} (${visitante})`);
  }

  console.log("\n--- FIN DEMO ---");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
