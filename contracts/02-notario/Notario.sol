// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Notario {
    struct Registro{
        address autor; // Cuenta que registra el documento (hash)
        uint64 registradoEn; // Timestamp de registro
        uint64 revocadoEn; // Timestamp de revocación, 0 si está activo
    }
    // Mapping hashDocumento -> Registro
    mapping(bytes32 => Registro) private registros;

    // Evento para notificar el registro de un documento
    event Registrado(bytes32 indexed _hashDocumento, address indexed _autor, uint64 _registradoEn);

    // Evento para notificar el revocado de un documento
    event Revocado(bytes32 indexed _hashDocumento, address indexed _autor, uint64 _revocadoEn);

    function registrar(bytes32 _hashDocumento) external returns (uint64 ts) {
        Registro storage r = registros[_hashDocumento];
        require(r.registradoEn == 0, "Documento ya registrado"); // Esto funciona como brakepoint para evitar sobreescritura
        ts = uint64(block.timestamp);
        r.autor = msg.sender;
        r.registradoEn = ts;
        emit Registrado(_hashDocumento, msg.sender, ts);
    }

    function revocar(bytes32 _hashDocumento) external returns (uint64 ts) {
        Registro storage r = registros[_hashDocumento];
        require(r.registradoEn != 0, "Documento no registrado");
        require(r.revocadoEn == 0, "Documento ya revocado");
        require(r.autor == msg.sender, "Solo el autor puede revocar");
        ts = uint64(block.timestamp);
        r.revocadoEn = ts;
        emit Revocado(_hashDocumento, msg.sender, ts);
    }

    function existe(bytes32 _hashDocumento) external view returns (bool){
        Registro storage r = registros[_hashDocumento];
        return r.registradoEn != 0 && r.revocadoEn == 0;
    }

    function obtener(bytes32 _hashDocumento) external view returns (address autor, uint64 registradoEn, uint64 revocadoEn){
        Registro storage r = registros[_hashDocumento];
        require(r.registradoEn != 0, "Documento no registrado");
        return (r.autor, r.registradoEn, r.revocadoEn);
    }
}
