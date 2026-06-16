import React from "react";
import { Table, Spinner, Button, Badge } from "react-bootstrap";

const TablaOrdenes = ({
  ordenes,
  detallesMap,
  productosDisponibles,
  clientesDisponibles,
  abrirModalEdicion,
  abrirModalCancelacion,
  cargando,
  numeracionPorFecha = {},
}) => {
  const formatearFecha = (fechaString) => {
    if (!fechaString) return "-";
    const fecha = new Date(fechaString);
    return fecha.toLocaleString();
  };

  return (
    <>
      {cargando ? (
        <div className="text-center my-4">
          <h4>Procesando órdenes...</h4>
          <Spinner animation="border" variant="primary" role="status" />
        </div>
      ) : ordenes && ordenes.length > 0 ? (
        <Table striped borderless hover responsive className="align-middle">
          <thead>
            <tr>
              <th>Orden #</th>
              <th>Cliente</th>
              <th>Fecha y Hora</th>
              <th className="d-none d-md-table-cell">
                Productos Solicitados (Detalle)
              </th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((o) => {
              const detalles = detallesMap[o.id_orden] || [];
              const cliente = clientesDisponibles.find(
                (c) => c.id_cliente.toString() === o.id_cliente?.toString(),
              );

              return (
                <tr key={o.id_orden}>
                  <td className="fw-bold">#{numeracionPorFecha[o.id_orden] || o.id_orden}</td>
                  <td>{cliente?.nombre_cliente || "Cliente"}</td>
                  <td>{formatearFecha(o.fecha_orden)}</td>
                  <td className="d-none d-md-table-cell">
                    <ul className="list-unstyled mb-0 small">
                      {detalles.map((d, index) => {
                        // El campo d.nombre_producto de la BD es un bigint (ID del producto)
                        const producto = productosDisponibles.find(
                          (p) =>
                            p.id_producto.toString() ===
                            d.nombre_producto?.toString(),
                        );

                        return (
                          <li
                            key={d.id_detalle_orden || index}
                            className="mb-1"
                          >
                            • {producto?.nombre_producto || "Producto"}{" "}
                            <strong>x{d.cantidad}</strong> -{" "}
                            <Badge
                              bg={
                                d.estado_orden === true ||
                                d.estado_orden === "true"
                                  ? "success"
                                  : "warning"
                              }
                            >
                              {d.estado_orden === true ||
                              d.estado_orden === "true"
                                ? "Listo"
                                : "En Cocina"}
                            </Badge>
                          </li>
                        );
                      })}
                    </ul>
                  </td>
                  <td className="text-center">
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="m-1"
                      onClick={() => abrirModalEdicion && abrirModalEdicion(o)}
                      disabled={detalles.length === 0 || (detalles.length > 0 && detalles.every(d => d.estado_orden === true || d.estado_orden === "true"))}
                      title={detalles.length === 0 ? "Orden cancelada - No se puede editar" : detalles.length > 0 && detalles.every(d => d.estado_orden === true || d.estado_orden === "true") ? "Orden completada - No se puede editar" : "Editar Orden"}
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() =>
                        abrirModalCancelacion && abrirModalCancelacion(o)
                      }
                      disabled={detalles.length === 0}
                      title={detalles.length === 0 ? "Orden ya cancelada" : "Cancelar Orden"}
                    >
                      <i className="bi bi-x-circle"></i>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      ) : (
        <div className="text-center my-4">
          <h5>No existen registros de órdenes vigentes.</h5>
        </div>
      )}
    </>
  );
};

export default TablaOrdenes;
