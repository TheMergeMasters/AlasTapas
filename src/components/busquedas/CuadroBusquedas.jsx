import React from 'react';
import {Form, InputGroup} from 'react-bootstrap';

const CuadroBusquedas = ({
  textoBusqueda,
  manejarCambioBusqueda,
  placeholder = "Buscar por nombre o descripción...",
}) => {
  return (
    <InputGroup className="busqueda-marca shadow-sm">
      <InputGroup.Text>
        <i className="bi bi-search"></i>
      </InputGroup.Text>
      <Form.Control
        type="text"
        placeholder={placeholder}
        value={textoBusqueda}
        onChange={manejarCambioBusqueda}
      />
    </InputGroup>
  );
};
export default CuadroBusquedas;