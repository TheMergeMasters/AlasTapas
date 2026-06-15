import React from "react";

const EncabezadoVista = ({ titulo, icono, subtitulo, acciones }) => {
  return (
    <header className="vista-encabezado">
      <div>
        <h1 className="vista-titulo">
          {icono && <i className={`${icono} vista-titulo-icono`} aria-hidden="true" />}
          {titulo}
        </h1>
        {subtitulo && <p className="vista-subtitulo">{subtitulo}</p>}
      </div>
      {acciones && <div className="vista-acciones">{acciones}</div>}
    </header>
  );
};

export default EncabezadoVista;
