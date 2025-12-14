// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title FichaClinica
 * @dev Implementación de una ficha clínica digital en Blockchain.
 * 
 * Cumplimiento de Evaluación 3:
 * - Almacenamiento de datos de salud (Structs y Mappings).
 * - Control de acceso estricto (Solo el paciente puede gestionar sus datos).
 * - Funciones para crear, consultar y actualizar información.
 * - Emisión de eventos ante cambios.
 * 
 * Funcionalidades Extras Implementadas:
 * 1. Sistema de Autorización Temporal: Los pacientes pueden dar permiso temporal a médicos para ver su ficha y agregar diagnósticos.
 * 2. Historial Médico: Se permite agregar múltiples diagnósticos con fecha y autor (médico o paciente).
 * 3. Auditoría de Accesos: Se registra quién y cuándo consultó la ficha (Log de visitas).
 * 4. Datos Inmutables vs Mutables: Se protegen datos vitales (tipo sangre, fecha nacimiento) permitiendo solo actualizar contacto.
 */

contract FichaClinica {
    
    struct Diagnostico {
        string descripcion;
        string tratamiento;
        uint256 fecha;
        address doctor;
    }

    /**
     * @dev Estructura principal de datos de salud.
     * - Datos Inmutables: tipoSangre, fechaNacimiento (Se definen al crear y no cambian).
     * - Datos Mutables: direccion, telefono (Se pueden actualizar para mantener contacto).
     * - Historial: Lista dinámica de diagnósticos.
     */
    struct DatosSalud {
        string tipoSangre;      // Inmutable
        uint256 fechaNacimiento; // Inmutable
        string direccion;       // Mutable
        string telefono;        // Mutable
        Diagnostico[] historial;
        bool existe;
    }

    struct Acceso {
        address visitante;
        uint256 fecha;
    }

    // Mapping privado: Paciente => DatosSalud
    mapping(address => DatosSalud) private fichas;

    // Mapping de autorizaciones: Paciente => Medico => Timestamp Expiracion
    mapping(address => mapping(address => uint256)) private autorizaciones;

    // Mapping de historial de accesos: Paciente => Lista de Accesos
    mapping(address => Acceso[]) private historialAccesos;

    // Evento para registrar cambios
    event FichaCreada(address indexed paciente, uint256 fecha);
    event DatosContactoActualizados(address indexed paciente, string direccion, string telefono, uint256 fecha);
    event NuevoDiagnostico(address indexed paciente, address indexed medico, string descripcion, uint256 fecha);
    event AccesoOtorgado(address indexed paciente, address indexed medico, uint256 expiracion);
    event AccesoRevocado(address indexed paciente, address indexed medico);
    event VisitaRegistrada(address indexed paciente, address indexed visitante, uint256 fecha);

    /**
     * @dev Crea la ficha clínica por primera vez. Datos estáticos inmutables.
     */
    function crearFicha(string memory _tipoSangre, uint256 _fechaNacimiento, string memory _direccion, string memory _telefono) public {
        require(!fichas[msg.sender].existe, "La ficha ya existe.");

        DatosSalud storage nuevaFicha = fichas[msg.sender];
        nuevaFicha.tipoSangre = _tipoSangre;
        nuevaFicha.fechaNacimiento = _fechaNacimiento;
        nuevaFicha.direccion = _direccion;
        nuevaFicha.telefono = _telefono;
        nuevaFicha.existe = true;

        emit FichaCreada(msg.sender, block.timestamp);
    }

    /**
     * @dev Permite al paciente actualizar sus datos de contacto.
     */
    function actualizarContacto(string memory _direccion, string memory _telefono) public {
        require(fichas[msg.sender].existe, "La ficha no existe.");
        
        DatosSalud storage ficha = fichas[msg.sender];
        ficha.direccion = _direccion;
        ficha.telefono = _telefono;
        
        emit DatosContactoActualizados(msg.sender, _direccion, _telefono, block.timestamp);
    }

    /**
     * @dev Agrega un nuevo diagnostico al historial. Requiere ser el paciente o medico autorizado.
     */
    function agregarDiagnostico(address _paciente, string memory _descripcion, string memory _tratamiento) public {
        require(fichas[_paciente].existe, "El paciente no tiene ficha.");

        bool esPaciente = msg.sender == _paciente;
        bool esMedicoAutorizado = autorizaciones[_paciente][msg.sender] > block.timestamp;

        require(esPaciente || esMedicoAutorizado, "No tiene permiso para agregar diagnosticos.");

        fichas[_paciente].historial.push(Diagnostico({
            descripcion: _descripcion,
            tratamiento: _tratamiento,
            fecha: block.timestamp,
            doctor: msg.sender
        }));

        emit NuevoDiagnostico(_paciente, msg.sender, _descripcion, block.timestamp);
    }

    /**
     * @dev Permite al paciente autorizar a un médico por un tiempo determinado.
     * @param _medico Dirección del médico a autorizar.
     * @param _tiempoSegundos Duración de la autorización en segundos.
     */
    function autorizarMedico(address _medico, uint256 _tiempoSegundos) public {
        uint256 expiracion = block.timestamp + _tiempoSegundos;
        autorizaciones[msg.sender][_medico] = expiracion;
        emit AccesoOtorgado(msg.sender, _medico, expiracion);
    }

    /**
     * @dev Permite al paciente revocar el acceso a un médico.
     * @param _medico Dirección del médico a revocar.
     */
    function revocarAcceso(address _medico) public {
        autorizaciones[msg.sender][_medico] = 0;
        emit AccesoRevocado(msg.sender, _medico);
    }

    /**
     * @dev Permite consultar la ficha clínica de un paciente.
     * @param _paciente Dirección del paciente dueño de la ficha.
     */
    function consultarFicha(address _paciente) public returns (string memory tipoSangre, uint256 fechaNacimiento, string memory direccion, string memory telefono, Diagnostico[] memory historial) {
        // Verificar permisos
        bool esPropietario = msg.sender == _paciente;
        bool esMedicoAutorizado = autorizaciones[_paciente][msg.sender] > block.timestamp;

        require(esPropietario || esMedicoAutorizado, "Acceso denegado");

        // Registrar visita si no es el propio paciente
        if (!esPropietario) {
            historialAccesos[_paciente].push(Acceso({
                visitante: msg.sender,
                fecha: block.timestamp
            }));
            emit VisitaRegistrada(_paciente, msg.sender, block.timestamp);
        }

        DatosSalud storage datos = fichas[_paciente];
        
        require(datos.existe, "No existe ficha clinica para este usuario");

        return (datos.tipoSangre, datos.fechaNacimiento, datos.direccion, datos.telefono, datos.historial);
    }

    /**
     * @dev Permite al paciente ver quién ha accedido a su ficha.
     */
    function verHistorialAccesos() public view returns (Acceso[] memory) {
        return historialAccesos[msg.sender];
    }
}
