import React from "react";
import { Table, Spinner, Button, Badge } from "react-bootstrap";

const TablaVenta = ({
  ventas,
  ordenesDisponibles,
  clientesDisponibles,
  detallesMap,
  productosDisponibles,
  cargando,
  abrirModalEdicion,
  abrirModalCancelacion,
  numeracionPorFecha = {},
}) => {
  return (
    <>
      {cargando ? (
        <div className="text-center my-4">
          <h4>Procesando ventas...</h4>
          <Spinner animation="border" variant="primary" role="status" />
        </div>
      ) : ventas && ventas.length > 0 ? (
        <Table striped borderless hover responsive className="align-middle">
          <thead>
            <tr>
              <th>Venta #</th>
              <th>Orden</th>
              <th>Cliente</th>
              <th className="d-none d-md-table-cell">Productos</th>
              <th className="text-end">Total</th>
              <th>Estado</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => {
              const orden = ordenesDisponibles.find(
                (o) => o.id_orden.toString() === v.id_orden?.toString(),
              );
              const cliente = clientesDisponibles.find(
                (c) => c.id_cliente.toString() === orden?.id_cliente?.toString(),
              );
              const detalles = detallesMap[v.id_orden] || [];

              return (
                <tr key={v.id_venta}>
                  <td className="fw-bold">#{numeracionPorFecha[v.id_venta] || v.id_venta}</td>
                  <td>#{v.id_orden}</td>
                  <td>{cliente?.nombre_cliente || "Cliente"}</td>
                  <td className="d-none d-md-table-cell">
                    <ul className="list-unstyled mb-0 small">
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
                  </td>
                  <td className="text-end fw-bold">
                    ${v.total_venta?.toFixed(2) || "0.00"}
                  </td>
                  <td>
                    <Badge
                      bg={
                        v.estado_venta === false
                          ? "danger"
                          : "warning"
                      }
                    >
                      {v.estado_venta === false ? "Cancelada" : "Pendiente"}
                    </Badge>
                  </td>
                  <td className="text-center">
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="m-1"
                      onClick={() => abrirModalEdicion && abrirModalEdicion(v)}
                      disabled={v.estado_venta === false}
                      title={v.estado_venta === false ? "Venta cancelada - No se puede editar" : "Editar Venta"}
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() =>
                        abrirModalCancelacion && abrirModalCancelacion(v)
                      }
                      disabled={v.estado_venta === false}
                      title={v.estado_venta === false ? "Venta ya cancelada" : "Cancelar Venta"}
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
        <div className="text-center my-5">
          <h5>No existen registros de ventas vigentes.</h5>
        </div>
      )}
    </>
  );
};

export default TablaVenta;
