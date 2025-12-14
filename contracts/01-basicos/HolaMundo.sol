// Modo de licenciamiento
// SPDX-License-Identifier: MIT

// Versión del compilador: Mayor o igual 0.8.18 y menor que 0.9.0
pragma solidity ^0.8.18;

contract HolaMundo {
    // Primera versión del código
    //string public saludo = "Hola Mundo desde Solidity";

    // Segunda versión del código
    // string private saludo;

    // constructor() {
    //     saludo = "Hola Mundo";
    // }

    // function getSaludo() public view returns (string memory) {
    //     return saludo;
    // }

    // Tercera versión del código
    string private saludo;

    constructor(string memory _saludo) {
        saludo = _saludo;
    }

    function getSaludo() public view returns (string memory) {
        return saludo;
    }

    function setSaludo(string memory _saludo) public {
        saludo = _saludo;
    }
}
