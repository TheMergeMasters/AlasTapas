import React, { useState } from "react";
import { Card, Button, Badge } from "react-bootstrap";

const TarjetaOrdenes = ({
  ordenes,
  detallesMap,
  productosDisponibles,
  clientesDisponibles,
  abrirModalEdicion,
  abrirModalCancelacion,
  numeracionPorFecha = {},
}) => {
  const [idTarjetaActiva, setIdTarjetaActiva] = useState(null);

  const formatearFecha = (fechaString) => {
    if (!fechaString) return "-";
    const fecha = new Date(fechaString);
    return fecha.toLocaleString();
  };

  const manejarClickTarjeta = (id) => {
    setIdTarjetaActiva(idTarjetaActiva === id ? null : id);
  };

  if (!ordenes || ordenes.length === 0) {
    return (
      <div className="text-center my-5">
        <h5>No existen registros de órdenes vigentes.</h5>
      </div>
    );
  }

  return (
    <div className="d-block d-lg-none">
      {ordenes.map((o) => {
        const detalles = detallesMap[o.id_orden] || [];
        const estaActiva = idTarjetaActiva === o.id_orden;
        const cliente = clientesDisponibles.find(
          (c) => c.id_cliente.toString() === o.id_cliente?.toString(),
        );

        return (
          <Card
            key={o.id_orden}
            className="mb-3 shadow-sm border-0 position-relative"
            onClick={() => manejarClickTarjeta(o.id_orden)}
            style={{ cursor: "pointer" }}
          >
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <span className="fw-bold text-primary">
                    Orden #{numeracionPorFecha[o.id_orden] || o.id_orden}
                  </span>
                  <br />
                  <span className="text-secondary small">
                    Cliente: {cliente?.nombre_cliente || "Cliente"}
                  </span>
                </div>
                <span className="text-muted small">
                  {formatearFecha(o.fecha_orden)}
                </span>
              </div>

              <div className="mt-2">
                <span className="text-secondary small d-block mb-1">
                  Productos:
                </span>
                <ul className="list-unstyled mb-0 ps-2 small">
                  {detalles.map((d, index) => {
                    const producto = productosDisponibles.find(
                      (p) =>
                        p.id_producto.toString() ===
                        d.nombre_producto?.toString(),
                    );
                    return (
                      <li key={d.id_detalle_orden || index} className="mb-1">
                        • {producto?.nombre_producto || "Producto"}{" "}
                        <strong>x{d.cantidad}</strong> -{" "}
                        <Badge
                          bg={
                            d.estado_orden === true || d.estado_orden === "true"
                              ? "success"
                              : "warning"
                          }
                        >
                          {d.estado_orden === true || d.estado_orden === "true"
                            ? "Listo"
                            : "En Cocina"}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="text-end mt-2">
                <i
                  className={`bi bi-chevron-${estaActiva ? "up" : "down"} text-secondary`}
                ></i>
              </div>
            </Card.Body>

            {estaActiva && (
              <div
                className="bg-light p-2 rounded-bottom border-top d-flex justify-content-around"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="outline-warning"
                  size="sm"
                  className="w-50 me-1"
                  onClick={() => abrirModalEdicion && abrirModalEdicion(o)}
                  disabled={detalles.length === 0 || (detalles.length > 0 && detalles.every(d => d.estado_orden === true || d.estado_orden === "true"))}
                  title={detalles.length === 0 ? "Orden cancelada - No se puede editar" : detalles.length > 0 && detalles.every(d => d.estado_orden === true || d.estado_orden === "true") ? "Orden completada - No se puede editar" : "Editar Orden"}
                >
                  <i className="bi bi-pencil me-1"></i> Editar
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="w-50 ms-1"
                  onClick={() =>
                    abrirModalCancelacion && abrirModalCancelacion(o)
                  }
                  disabled={detalles.length === 0}
                  title={detalles.length === 0 ? "Orden ya cancelada" : "Cancelar Orden"}
                >
                  <i className="bi bi-x-circle me-1"></i> Cancelar
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default TarjetaOrdenes;
