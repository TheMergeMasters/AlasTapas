import React, { useState } from "react";
import { Card, Button, Badge } from "react-bootstrap";

const TarjetaVenta = ({
  ventas,
  ordenesDisponibles,
  clientesDisponibles,
  detallesMap,
  productosDisponibles,
  abrirModalEdicion,
  abrirModalCancelacion,
  numeracionPorFecha = {},
}) => {
  const [idTarjetaActiva, setIdTarjetaActiva] = useState(null);

  const manejarClickTarjeta = (id) => {
    setIdTarjetaActiva(idTarjetaActiva === id ? null : id);
  };

  if (!ventas || ventas.length === 0) {
    return (
      <div className="text-center my-5">
        <h5>No existen registros de ventas vigentes.</h5>
      </div>
    );
  }

  return (
    <div className="d-block d-lg-none">
      {ventas.map((v) => {
        const orden = ordenesDisponibles.find(
          (o) => o.id_orden.toString() === v.id_orden?.toString(),
        );
        const cliente = clientesDisponibles.find(
          (c) => c.id_cliente.toString() === orden?.id_cliente?.toString(),
        );
        const detalles = detallesMap[v.id_orden] || [];
        const estaActiva = idTarjetaActiva === v.id_venta;

        return (
          <Card
            key={v.id_venta}
            className="mb-3 shadow-sm border-0 position-relative"
            onClick={() => manejarClickTarjeta(v.id_venta)}
            style={{ cursor: "pointer" }}
          >
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <span className="fw-bold text-primary">
                    Venta #{numeracionPorFecha[v.id_venta] || v.id_venta}
                  </span>
                  <br />
                  <span className="text-secondary small">
                    Orden: #{v.id_orden}
                  </span>
                  <br />
                  <span className="text-secondary small">
                    Cliente: {cliente?.nombre_cliente || "Cliente"}
                  </span>
                </div>
                <Badge
                  bg={
                    v.estado_venta === false
                      ? "danger"
                      : "warning"
                  }
                >
                  {v.estado_venta === false ? "Cancelada" : "Pendiente"}
                </Badge>
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
                      <li key={index} className="mb-1">
                        • {producto?.nombre_producto || "Producto"}{" "}
                        <strong>x{d.cantidad}</strong>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-3">
                <h6 className="mb-0">
                  Total: <strong>${v.total_venta?.toFixed(2) || "0.00"}</strong>
                </h6>
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
                  onClick={() => abrirModalEdicion && abrirModalEdicion(v)}
                  disabled={v.estado_venta === false}
                  title={v.estado_venta === false ? "Venta cancelada - No se puede editar" : "Editar Venta"}
                >
                  <i className="bi bi-pencil me-1"></i> Editar
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="w-50 ms-1"
                  onClick={() =>
                    abrirModalCancelacion && abrirModalCancelacion(v)
                  }
                  disabled={v.estado_venta === false}
                  title={v.estado_venta === false ? "Venta ya cancelada" : "Cancelar Venta"}
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

export default TarjetaVenta;
