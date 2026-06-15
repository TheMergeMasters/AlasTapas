import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import ModalRegistroVenta from "../components/ventas/ModalRegistroVenta";
import ModalEdicionVenta from "../components/ventas/ModalEdicionVenta";
import ModalCancelacionVenta from "../components/ventas/ModalCancelacionVenta";
import TablaVenta from "../components/ventas/TablaVenta";
import TarjetaVenta from "../components/ventas/TarjetaVenta";
import Paginacion from "../components/ordenamiento/Paginacion";
import NotificacionOperacion from "../components/NotificacionOperacion";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import EncabezadoVista from "../components/layout/EncabezadoVista";

const Ventas = () => {
  const [ventas, setVentas] = useState([]);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [ordenesDisponibles, setOrdenesDisponibles] = useState([]);
  const [clientesDisponibles, setClientesDisponibles] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [detallesMap, setDetallesMap] = useState({});
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  // Modales de Control
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [mostrarModalCancelacion, setMostrarModalCancelacion] = useState(false);
  const [ventaACancelar, setVentaACancelar] = useState(null);

  // Estados del Formulario de Registro
  const [nuevaVenta, setNuevaVenta] = useState({ id_orden: "", estado_venta: "pendiente" });
  const [detalleOrdenSeleccionada, setDetalleOrdenSeleccionada] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [totalVenta, setTotalVenta] = useState(0);

  // Estados del Formulario de Edición
  const [ventaEditar, setVentaEditar] = useState({
    id_venta: "",
    id_orden: "",
    estado_venta: "pendiente",
    total_venta: 0,
  });

  // Estado de Notificaciones
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

  // Paginación
  const [registrosPorPagina, establecerRegistrosPorPagina] = useState(5);
  const [paginaActual, establecerPaginaActual] = useState(1);

  const ventasOrdenadasProcesadas = [...ventasFiltradas].sort(
    (a, b) => b.id_venta - a.id_venta,
  );

  const ventasPaginadas = ventasOrdenadasProcesadas.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina,
  );

  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtrado de búsquedas interactivo
  useEffect(() => {
    if (!textoBusqueda.trim()) {
      setVentasFiltradas(ventas);
    } else {
      const textoLower = textoBusqueda.toLowerCase().trim();
      const filtradas = ventas.filter((v) => {
        const idVentaStr = v.id_venta.toString();
        const idOrdenStr = v.id_orden.toString();
        const cliente = clientesDisponibles.find(
          (c) => c.id_cliente.toString() === ordenesDisponibles.find(
            (o) => o.id_orden.toString() === v.id_orden?.toString()
          )?.id_cliente?.toString(),
        );
        return (
          idVentaStr.includes(textoLower) ||
          idOrdenStr.includes(textoLower) ||
          cliente?.nombre_cliente?.toLowerCase().includes(textoLower)
        );
      });
      setVentasFiltradas(filtradas);
    }
  }, [textoBusqueda, ventas, clientesDisponibles, ordenesDisponibles]);

  useEffect(() => {
    const totalPaginas = Math.max(
      1,
      Math.ceil((ventasFiltradas.length || 0) / registrosPorPagina),
    );
    if (paginaActual > totalPaginas) {
      establecerPaginaActual(1);
    }
  }, [ventasFiltradas, registrosPorPagina, paginaActual]);

  const cargarDatos = async () => {
    try {
      setCargando(true);

      // Cargar órdenes
      const { data: dataOrdenes } = await supabase
        .from("ordenes")
        .select("id_orden, fecha_orden, id_cliente");

      // Cargar clientes
      const { data: dataClientes } = await supabase
        .from("clientes")
        .select("id_cliente, nombre_cliente");

      // Cargar productos
      const { data: dataProductos } = await supabase
        .from("productos")
        .select("id_producto, nombre_producto, precio_costo");

      // Cargar detalles de órdenes
      const { data: dataDetalles } = await supabase
        .from("detalles_ordenes")
        .select("*");

      // Cargar ventas
      const { data: dataVentas } = await supabase
        .from("ventas")
        .select("*")
        .order("id_venta", { ascending: true });

      if (dataOrdenes) {
        const ordenesOrdenadas = dataOrdenes.sort((a, b) => b.id_orden - a.id_orden);
        setOrdenesDisponibles(ordenesOrdenadas);
      }
      if (dataClientes) setClientesDisponibles(dataClientes);
      if (dataProductos) setProductosDisponibles(dataProductos);
      if (dataVentas) setVentas(dataVentas);

      // Crear mapa de detalles
      const mapa = {};
      dataDetalles?.forEach((d) => {
        if (!mapa[d.id_orden]) mapa[d.id_orden] = [];
        mapa[d.id_orden].push(d);
      });
      setDetallesMap(mapa);
    } catch (err) {
      console.error("Error al cargar datos de ventas:", err);
      setToast({
        mostrar: true,
        mensaje: "Error al cargar los datos",
        tipo: "error",
      });
    } finally {
      setCargando(false);
    }
  };

  const calcularTotalVenta = (idOrden) => {
    const detalles = detallesMap[idOrden] || [];
    let total = 0;

    detalles.forEach((detalle) => {
      const producto = productosDisponibles.find(
        (p) => p.id_producto.toString() === detalle.nombre_producto?.toString(),
      );
      if (producto) {
        total += producto.precio_costo * detalle.cantidad;
      }
    });

    return total;
  };

  const manejoCambioInput = (e) => {
    const { name, value } = e.target;
    setNuevaVenta((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "id_orden" && value) {
      // Cargar detalles de la orden seleccionada
      const detalles = detallesMap[value] || [];
      const orden = ordenesDisponibles.find((o) => o.id_orden.toString() === value.toString());
      const cliente = clientesDisponibles.find(
        (c) => c.id_cliente.toString() === orden?.id_cliente?.toString(),
      );

      setDetalleOrdenSeleccionada(detalles);
      setClienteSeleccionado(cliente);
      
      const total = calcularTotalVenta(value);
      setTotalVenta(total);
    }
  };

  const agregarVenta = async () => {
    try {
      if (!nuevaVenta.id_orden) {
        setToast({
          mostrar: true,
          mensaje: "Debe seleccionar una orden",
          tipo: "error",
        });
        return;
      }

      const total = calcularTotalVenta(nuevaVenta.id_orden);
      const totalRedondeado = parseFloat(total.toFixed(2));
      const estadoBoolean = (nuevaVenta.estado_venta || "pendiente") !== "cancelada";

      const { error: errVenta } = await supabase
        .from("ventas")
        .insert([
          {
            id_orden: parseInt(nuevaVenta.id_orden),
            estado_venta: estadoBoolean,
            total_venta: totalRedondeado,
          },
        ]);

      if (errVenta) throw errVenta;

      setMostrarModal(false);
      setNuevaVenta({ id_orden: "", estado_venta: "pendiente" });
      setDetalleOrdenSeleccionada(null);
      setClienteSeleccionado(null);
      setTotalVenta(0);
      await cargarDatos();

      setToast({
        mostrar: true,
        mensaje: "Venta registrada exitosamente",
        tipo: "exito",
      });
    } catch (err) {
      console.error("Error al registrar venta:", err);
      setToast({
        mostrar: true,
        mensaje: `Error: ${err.message || "No se pudo registrar"}`,
        tipo: "error",
      });
    }
  };

  const abrirModalEdicion = (venta) => {
    const orden = ordenesDisponibles.find((o) => o.id_orden.toString() === venta.id_orden?.toString());
    const detalles = detallesMap[venta.id_orden] || [];
    const cliente = clientesDisponibles.find(
      (c) => c.id_cliente.toString() === orden?.id_cliente?.toString(),
    );

    const estadoTexto = venta.estado_venta === false ? "cancelada" : "pendiente";

    setVentaEditar({
      id_venta: venta.id_venta,
      id_orden: venta.id_orden,
      estado_venta: estadoTexto,
      total_venta: venta.total_venta,
    });

    setDetalleOrdenSeleccionada(detalles);
    setClienteSeleccionado(cliente);
    setTotalVenta(venta.total_venta);
    setMostrarModalEdicion(true);
  };

  const manejoCambioInputEdicion = (e) => {
    const { name, value } = e.target;
    setVentaEditar((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const actualizarVenta = async () => {
    try {
      const estadoBoolean = (ventaEditar.estado_venta || "pendiente") !== "cancelada";
      const { error: errVenta } = await supabase
        .from("ventas")
        .update({
          estado_venta: estadoBoolean,
        })
        .eq("id_venta", ventaEditar.id_venta);

      if (errVenta) throw errVenta;

      setMostrarModalEdicion(false);
      await cargarDatos();

      setToast({
        mostrar: true,
        mensaje: "Venta actualizada exitosamente",
        tipo: "exito",
      });
    } catch (err) {
      console.error("Error al actualizar venta:", err);
      setToast({
        mostrar: true,
        mensaje: `Error: ${err.message || "No se pudo actualizar"}`,
        tipo: "error",
      });
    }
  };

  const abrirModalCancelacion = (venta) => {
    setVentaACancelar(venta);
    setMostrarModalCancelacion(true);
  };

  const cancelarVenta = async () => {
    try {
      const { error: errVenta } = await supabase
        .from("ventas")
        .update({ estado_venta: false })
        .eq("id_venta", ventaACancelar.id_venta);

      if (errVenta) throw errVenta;

      setMostrarModalCancelacion(false);
      await cargarDatos();

      setToast({
        mostrar: true,
        mensaje: "Venta cancelada exitosamente",
        tipo: "exito",
      });
    } catch (err) {
      console.error("Error al cancelar venta:", err);
      setToast({
        mostrar: true,
        mensaje: `Error: ${err.message || "No se pudo cancelar"}`,
        tipo: "error",
      });
    }
  };

  return (
    <Container fluid className="vista-contenedor px-3 px-md-4">
      <EncabezadoVista
        titulo="Ventas"
        icono="bi bi-cash-coin"
        subtitulo="Consulta y registra las ventas del negocio"
        acciones={
          <Button onClick={() => setMostrarModal(true)} className="btn-marca">
            <i className="bi-plus-lg"></i>
            <span className="d-none d-sm-inline ms-2">Nueva Venta</span>
          </Button>
        }
      />

      <Row className="mb-4">
        <Col md={6} lg={5}>
          <CuadroBusquedas
            textoBusqueda={textoBusqueda}
            manejarCambioBusqueda={(e) => setTextoBusqueda(e.target.value)}
            placeholder="Buscar por ID venta, orden o cliente..."
          />
        </Col>
      </Row>

      {/* Vista Móvil */}
      <Row className="d-lg-none">
        <Col xs={12}>
          <TarjetaVenta
            ventas={ventasPaginadas}
            ordenesDisponibles={ordenesDisponibles}
            clientesDisponibles={clientesDisponibles}
            detallesMap={detallesMap}
            productosDisponibles={productosDisponibles}
            abrirModalEdicion={abrirModalEdicion}
            abrirModalCancelacion={abrirModalCancelacion}
          />
        </Col>
      </Row>

      {/* Vista Escritorio */}
      <Row className="d-none d-lg-block">
        <Col xs={12}>
          <div className="vista-panel">
            <TablaVenta
            ventas={ventasPaginadas}
            ordenesDisponibles={ordenesDisponibles}
            clientesDisponibles={clientesDisponibles}
            detallesMap={detallesMap}
            productosDisponibles={productosDisponibles}
            cargando={cargando}
            abrirModalEdicion={abrirModalEdicion}
            abrirModalCancelacion={abrirModalCancelacion}
          />
          </div>
        </Col>
      </Row>

      {ventasFiltradas.length > 0 && (
        <Row className="mt-3">
          <Col>
            <Paginacion
              registrosPorPagina={registrosPorPagina}
              totalRegistros={ventasFiltradas.length}
              paginaActual={paginaActual}
              establecerPaginaActual={establecerPaginaActual}
              establecerRegistrosPorPagina={establecerRegistrosPorPagina}
            />
          </Col>
        </Row>
      )}

      {/* Modales Relacionados */}
      <ModalRegistroVenta
        mostrarModal={mostrarModal}
        setMostrarModal={setMostrarModal}
        nuevaVenta={nuevaVenta}
        manejoCambioInput={manejoCambioInput}
        agregarVenta={agregarVenta}
        ordenesDisponibles={ordenesDisponibles}
        detalleOrdenSeleccionada={detalleOrdenSeleccionada}
        clienteSeleccionado={clienteSeleccionado}
        productosDisponibles={productosDisponibles}
        totalVenta={totalVenta}
      />

      <ModalEdicionVenta
        mostrarModalEdicion={mostrarModalEdicion}
        setMostrarModalEdicion={setMostrarModalEdicion}
        ventaEditar={ventaEditar}
        manejoCambioInputEdicion={manejoCambioInputEdicion}
        actualizarVenta={actualizarVenta}
        detalleOrdenSeleccionada={detalleOrdenSeleccionada}
        clienteSeleccionado={clienteSeleccionado}
        productosDisponibles={productosDisponibles}
        totalVenta={totalVenta}
      />

      <ModalCancelacionVenta
        mostrarModalCancelacion={mostrarModalCancelacion}
        setMostrarModalCancelacion={setMostrarModalCancelacion}
        ventaACancelar={ventaACancelar}
        cancelarVenta={cancelarVenta}
      />

      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onClose={() => setToast({ ...toast, mostrar: false })}
      />
    </Container>
  );
};

export default Ventas;
