// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract FichaClinica {
    
    struct DatosSalud {
        string condicion;
        string tratamiento;
        uint256 fecha;
        bool existe; // Flag para validar existencia
    }

    // Mapping privado: Paciente => DatosSalud
    mapping(address => DatosSalud) private fichas;

    // Evento para registrar cambios
    event FichaActualizada(address indexed paciente, uint256 fecha);

    /**
     * @dev Permite al paciente actualizar sus propios datos médicos.
     * @param _condicion Descripción de la condición médica.
     * @param _tratamiento Descripción del tratamiento.
     */
    function actualizarFicha(string memory _condicion, string memory _tratamiento) public {
        fichas[msg.sender] = DatosSalud({
            condicion: _condicion,
            tratamiento: _tratamiento,
            fecha: block.timestamp,
            existe: true
        });

        emit FichaActualizada(msg.sender, block.timestamp);
    }

    /**
     * @dev Permite al paciente consultar sus propios datos.
     * @return condicion La condición médica almacenada.
     * @return tratamiento El tratamiento almacenado.
     * @return fecha La fecha de la última actualización.
     */
    function consultarFicha() public view returns (string memory condicion, string memory tratamiento, uint256 fecha) {
        DatosSalud memory datos = fichas[msg.sender];
        
        require(datos.existe, "No existe ficha clinica para este usuario");

        return (datos.condicion, datos.tratamiento, datos.fecha);
    }
}
