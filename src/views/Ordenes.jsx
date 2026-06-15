import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import ModalRegistroOrden from "../components/orden/ModalRegistroOrden";
import ModalEdicionOrden from "../components/orden/ModalEdicionOrden";
import ModalCancelacionOrden from "../components/orden/ModalCancelacionOrden";
import TablaOrdenes from "../components/orden/TablaOrdenes";
import TarjetaOrdenes from "../components/orden/TarjetasOrdenes";
import Paginacion from "../components/ordenamiento/Paginacion";
import NotificacionOperacion from "../components/NotificacionOperacion";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import EncabezadoVista from "../components/layout/EncabezadoVista";

const Ordenes = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [ordenesFiltradas, setOrdenesFiltradas] = useState([]);
  const [detallesMap, setDetallesMap] = useState({});
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [clientesDisponibles, setClientesDisponibles] = useState([]);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  // Modales de Control
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [mostrarModalCancelacion, setMostrarModalCancelacion] = useState(false);
  const [ordenACancelar, setOrdenACancelar] = useState(null);

  // Estados del Formulario de Registro
  const [nuevaOrden, setNuevaOrden] = useState({ fecha_orden: "", id_cliente: "" });
  const [detallesOrden, setDetallesOrden] = useState([]);

  // Estados del Formulario de Edición
  const [ordenEditar, setOrdenEditar] = useState({
    id_orden: "",
    fecha_orden: "",
    id_cliente: "",
  });
  const [detallesEditar, setDetallesEditar] = useState([]);

  // Estado de Notificaciones
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

  // Paginación
  const [registrosPorPagina, establecerRegistrosPorPagina] = useState(5);
  const [paginaActual, establecerPaginaActual] = useState(1);

  const ordenesOrdenadasProcesadas = [...ordenesFiltradas].sort(
    (a, b) => b.id_orden - a.id_orden,
  );

  const ordenesPaginadas = ordenesOrdenadasProcesadas.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina,
  );

  useEffect(() => {
    cargarProductosDisponibles();
    cargarClientesDisponibles();
    cargarOrdenesYDetalles();
  }, []);

  // Filtrado de búsquedas interactivo
  useEffect(() => {
    if (!textoBusqueda.trim()) {
      setOrdenesFiltradas(ordenes);
    } else {
      const textoLower = textoBusqueda.toLowerCase().trim();
      const filtrados = ordenes.filter((o) => {
        const idOrdenStr = o.id_orden.toString();
        const itemsDetalle = detallesMap[o.id_orden] || [];
        const contieneProducto = itemsDetalle.some((d) => {
          // Buscamos el nombre comercial usando d.nombre_producto (que contiene el ID)
          const prod = productosDisponibles.find(
            (p) => p.id_producto.toString() === d.nombre_producto?.toString(),
          );
          return prod?.nombre_producto?.toLowerCase().includes(textoLower);
        });
        return idOrdenStr.includes(textoLower) || contieneProducto;
      });
      setOrdenesFiltradas(filtrados);
    }
  }, [textoBusqueda, ordenes, detallesMap, productosDisponibles]);

  useEffect(() => {
    const totalPaginas = Math.max(
      1,
      Math.ceil((ordenesFiltradas.length || 0) / registrosPorPagina),
    );
    if (paginaActual > totalPaginas) {
      establecerPaginaActual(1);
    }
  }, [ordenesFiltradas, registrosPorPagina, paginaActual]);

  const cargarProductosDisponibles = async () => {
    const { data } = await supabase
      .from("productos")
      .select("id_producto, nombre_producto");
    if (data) setProductosDisponibles(data);
  };

  const cargarClientesDisponibles = async () => {
    const { data } = await supabase
      .from("clientes")
      .select("id_cliente, nombre_cliente");
    if (data) setClientesDisponibles(data);
  };

  const cargarOrdenesYDetalles = async () => {
    try {
      setCargando(true);
      const { data: dataOrdenes, error: errOrd } = await supabase
        .from("ordenes")
        .select("*")
        .order("id_orden", { ascending: true });

      if (errOrd) throw errOrd;

      const { data: dataDetalles, error: errDet } = await supabase
        .from("detalles_ordenes")
        .select("*");
      if (errDet) throw errDet;

      const mapa = {};
      dataDetalles?.forEach((d) => {
        if (!mapa[d.id_orden]) mapa[d.id_orden] = [];
        mapa[d.id_orden].push(d);
      });

      setDetallesMap(mapa);
      setOrdenes(dataOrdenes || []);
      setOrdenesFiltradas(dataOrdenes || []);
    } catch (err) {
      console.error("Error al procesar el flujo de órdenes:", err);
    } finally {
      setCargando(false);
    }
  };

  // --- Registro de Órdenes Nuevas ---
  const manejoCambioInput = (e) => {
    const { name, value } = e.target;
    setNuevaOrden((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const agregarDetalleAlFormulario = (nuevoDetalle) => {
    setDetallesOrden((prev) => [...prev, nuevoDetalle]);
  };

  const eliminarDetalleDelFormulario = (index) => {
    setDetallesOrden((prev) => prev.filter((_, i) => i !== index));
  };

const agregarOrden = async () => {
  try {
    // 1. Validación de seguridad: Si el usuario no seleccionó fecha, usamos la fecha y hora actual automáticamente
    let fechaFinal = nuevaOrden.fecha_orden;
    if (!fechaFinal || fechaFinal.trim() === "") {
      fechaFinal = new Date().toISOString(); // Formato ISO estricto que Supabase ama (Ej: 2026-05-18T23:00:00Z)
    } else {
      // Si el usuario sí eligió una fecha, la convertimos a formato ISO válido para PostgreSQL
      fechaFinal = new Date(fechaFinal).toISOString();
    }

    // 2. Inserción de la Cabecera de la Orden
    const { data: ordenGuardada, error: errCabecera } = await supabase
      .from("ordenes")
      .insert([{
        fecha_orden: fechaFinal,
        id_cliente: parseInt(nuevaOrden.id_cliente)
      }]) // Enviamos la fecha y id_cliente completamente formateados
      .select()
      .single();

    if (errCabecera) throw errCabecera;

    // 3. Mapeo y preparación de los detalles para la base de datos
    const filasDetalle = detallesOrden.map((d) => ({
      id_orden: ordenGuardada.id_orden,
      nombre_producto: parseInt(d.id_producto), // Envía el bigint requerido
      estado_orden: d.estado_orden === true || d.estado_orden === "true", // Envía el boolean requerido
      cantidad: parseInt(d.cantidad),
    }));

    // 4. Inserción de los detalles de la orden
    const { error: errFilas } = await supabase
      .from("detalles_ordenes")
      .insert(filasDetalle);
      
    if (errFilas) throw errFilas;

    // 5. Limpieza de estados y cierre de modal exitoso
    setMostrarModal(false);
    setDetallesOrden([]);
    setNuevaOrden({ fecha_orden: "", id_cliente: "" });
    await cargarOrdenesYDetalles();

    setToast({
      mostrar: true,
      mensaje: "Orden y Detalles ingresados a cocina",
      tipo: "exito",
    });
  } catch (err) {
    console.error("Error detallado en la inserción de Ordenes:", err);
    setToast({
      mostrar: true,
      mensaje: `Error al registrar: ${err.message || "Campos inválidos"}`,
      tipo: "error",
    });
  }
};
  // --- Edición de Órdenes ---
  const agregarDetalleEdicion = (nuevoDetalle) => {
    setDetallesEditar((prev) => [...prev, nuevoDetalle]);
  };

  const eliminarDetalleEdicion = (index) => {
    setDetallesEditar((prev) => prev.filter((_, i) => i !== index));
  };

  const actualizarEstadoDetalleEdicion = (index, nuevoEstado) => {
    setDetallesEditar((prev) => {
      const actualizado = [...prev];
      actualizado[index].estado_orden = nuevoEstado;
      return actualizado;
    });
  };

  const abrirModalEdicion = (orden) => {
    const detallesDeEstaOrden = detallesMap[orden.id_orden] || [];
    setOrdenEditar({
      id_orden: orden.id_orden,
      fecha_orden: orden.fecha_orden || "",
      id_cliente: orden.id_cliente || "",
    });
    setDetallesEditar(detallesDeEstaOrden);
    setMostrarModalEdicion(true);
  };

  // Resuelve la advertencia de campo de solo lectura (Read-only) de React
  const manejoCambioInputEdicion = (e) => {
    const { name, value } = e.target;
    setOrdenEditar((prev) => ({ ...prev, [name]: value }));
  };

  const actualizarOrden = async () => {
    try {
      // 1. Actualizar fecha e id_cliente en cabecera
      const { error: errUpt } = await supabase
        .from("ordenes")
        .update({
          fecha_orden: ordenEditar.fecha_orden,
          id_cliente: parseInt(ordenEditar.id_cliente)
        })
        .eq("id_orden", ordenEditar.id_orden);

      if (errUpt) throw errUpt;

      // 2. Limpieza de detalles anteriores
      await supabase
        .from("detalles_ordenes")
        .delete()
        .eq("id_orden", ordenEditar.id_orden);

      // 3. Preparación estricta alineada a Supabase (bigint y boolean)
      const filasNuevas = detallesEditar.map((d) => {
        // En detalles existentes viene como d.nombre_producto, en nuevos viene como d.id_producto
        const idProductoCorrecto = d.id_producto || d.nombre_producto;

        return {
          id_orden: parseInt(ordenEditar.id_orden),
          nombre_producto: parseInt(idProductoCorrecto), // Se envía obligatoriamente como entero numérico
          cantidad: parseInt(d.cantidad) || 1,
          estado_orden: d.estado_orden === true || d.estado_orden === "true", // Booleano puro
        };
      });

      const { error: errInsertNuevos } = await supabase
        .from("detalles_ordenes")
        .insert(filasNuevas);

      if (errInsertNuevos) throw errInsertNuevos;

      setMostrarModalEdicion(false);
      await cargarOrdenesYDetalles();
      setToast({
        mostrar: true,
        mensaje: "Orden modificada de forma exitosa",
        tipo: "exito",
      });
    } catch (err) {
      console.error("Error al actualizar la orden en Supabase:", err);
      setToast({
        mostrar: true,
        mensaje: `Error en base de datos: ${err.message || "400"}`,
        tipo: "error",
      });
    }
  };

  // --- Cancelación de Órdenes ---
  const abrirModalCancelacion = (orden) => {
    setOrdenACancelar(orden);
    setMostrarModalCancelacion(true);
  };

  const cancelarOrden = async () => {
    try {
      const { error: errDetalle } = await supabase
        .from("detalles_ordenes")
        .delete()
        .eq("id_orden", ordenACancelar.id_orden);

      if (errDetalle) throw errDetalle;

      setMostrarModalCancelacion(false);
      await cargarOrdenesYDetalles();
      setToast({
        mostrar: true,
        mensaje: "La orden ha sido removida del sistema",
        tipo: "exito",
      });
    } catch (err) {
      console.error(err);
      setToast({
        mostrar: true,
        mensaje: "No se pudo completar la cancelación",
        tipo: "error",
      });
    }
  };

  return (
    <Container fluid className="vista-contenedor px-3 px-md-4">
      <EncabezadoVista
        titulo="Órdenes"
        icono="bi bi-receipt"
        subtitulo="Registra y administra las órdenes de pedido"
        acciones={
          <Button onClick={() => setMostrarModal(true)} className="btn-marca">
            <i className="bi-plus-lg"></i>
            <span className="d-none d-sm-inline ms-2">Nueva Orden</span>
          </Button>
        }
      />

      <Row className="mb-4">
        <Col md={6} lg={5}>
          <CuadroBusquedas
            textoBusqueda={textoBusqueda}
            manejarCambioBusqueda={(e) => setTextoBusqueda(e.target.value)}
            placeholder="Buscar por ID de orden o por platillo..."
          />
        </Col>
      </Row>

      {/* Vista Móvil */}
      <Row className="d-lg-none">
        <Col xs={12}>
          <TarjetaOrdenes
            ordenes={ordenesPaginadas}
            detallesMap={detallesMap}
            productosDisponibles={productosDisponibles}
            clientesDisponibles={clientesDisponibles}
            abrirModalEdicion={abrirModalEdicion}
            abrirModalCancelacion={abrirModalCancelacion}
          />
        </Col>
      </Row>

      {/* Vista Escritorio */}
      <Row className="d-none d-lg-block">
        <Col xs={12}>
          <div className="vista-panel">
            <TablaOrdenes
            ordenes={ordenesPaginadas}
            detallesMap={detallesMap}
            productosDisponibles={productosDisponibles}
            clientesDisponibles={clientesDisponibles}
            cargando={cargando}
            abrirModalEdicion={abrirModalEdicion}
            abrirModalCancelacion={abrirModalCancelacion}
          />
          </div>
        </Col>
      </Row>

      {ordenesFiltradas.length > 0 && (
        <Row className="mt-3">
          <Col>
            <Paginacion
              registrosPorPagina={registrosPorPagina}
              totalRegistros={ordenesFiltradas.length}
              paginaActual={paginaActual}
              establecerPaginaActual={establecerPaginaActual}
              establecerRegistrosPorPagina={establecerRegistrosPorPagina}
            />
          </Col>
        </Row>
      )}

      {/* Modales Relacionados */}
      <ModalRegistroOrden
        mostrarModal={mostrarModal}
        setMostrarModal={setMostrarModal}
        nuevaOrden={nuevaOrden}
        detallesOrden={detallesOrden}
        manejoCambioInput={manejoCambioInput}
        agregarDetalleAlFormulario={agregarDetalleAlFormulario}
        eliminarDetalleDelFormulario={eliminarDetalleDelFormulario}
        agregarOrden={agregarOrden}
        productosDisponibles={productosDisponibles}
        clientesDisponibles={clientesDisponibles}
      />

      <ModalEdicionOrden
        mostrarModalEdicion={mostrarModalEdicion}
        setMostrarModalEdicion={setMostrarModalEdicion}
        ordenEditar={ordenEditar}
        detallesEditar={detallesEditar}
        manejoCambioInputEdicion={manejoCambioInputEdicion}
        agregarDetalleEdicion={agregarDetalleEdicion}
        eliminarDetalleEdicion={eliminarDetalleEdicion}
        actualizarEstadoDetalleEdicion={actualizarEstadoDetalleEdicion}
        actualizarOrden={actualizarOrden}
        productosDisponibles={productosDisponibles}
        clientesDisponibles={clientesDisponibles}
      />

      <ModalCancelacionOrden
        mostrarModalCancelacion={mostrarModalCancelacion}
        setMostrarModalCancelacion={setMostrarModalCancelacion}
        ordenACancelar={ordenACancelar}
        cancelarOrden={cancelarOrden}
      />

      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onCerrar={() => setToast({ ...toast, mostrar: false })}
      />
    </Container>
  );
};

export default Ordenes;
