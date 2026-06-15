import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import NotificacionOperacion from "../components/NotificacionOperacion";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import Paginacion from "../components/ordenamiento/Paginacion";
import TablaClientes from "../components/clientes/TablaClientes";
import TarjetaCliente from "../components/clientes/TarjetaCliente";
import ModalRegistroCliente from "../components/clientes/ModalRegistroCliente";
import ModalEdicionCliente from "../components/clientes/ModalEdicionCliente";
import ModalEliminacionCliente from "../components/clientes/ModalEliminacionCliente";
import EncabezadoVista from "../components/layout/EncabezadoVista";

const Clientes = () => {
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre_cliente: "",
    apellido_cliente: "",
    direccion_cliente: "",
    telefono_cliente: "",
  });

  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true); // Estado de carga inicial
  const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
  const [clienteAEliminar, setClienteAEliminar] = useState(null);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [registroPorPagina, establecerRegistroPorPagina] = useState(5);
  const [PaginaActual, establecerPaginaActual] = useState(1);

  const manejarBusqueda = (e) => {
    setTextoBusqueda(e.target.value);
  };

  const clientesPaginados = clientesFiltrados.slice(
    (PaginaActual - 1) * registroPorPagina,
    PaginaActual * registroPorPagina
  );

  const [clienteEditar, setClienteEditar] = useState({
    id_cliente: "",
    nombre_cliente: "",
    apellido_cliente: "",
    direccion_cliente: "",
    telefono_cliente: "",
  });

  const cargarClientes = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("id_cliente", { ascending: true });
      if (error) {
        console.error("Error al cargar clientes:", error.message);
        setToast({
          mostrar: true,
          mensaje: "Error al cargar clientes.",
          tipo: "error",
        });
        
        return;
      }
      setClientes(
        (data || []).map((item) => ({
          ...item,
          descripcion_cliente:
            item.descripcion_cliente ?? item.descripcion ?? "",
          nombre_categoria: item.nombre_categoria ?? item.nombre ?? "",
        })),
      );
    } catch (err) {
      console.error("Excepción al cargar clientes:", err.message);
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al cargar clientes.",
        tipo: "error",
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  useEffect(() => {
    if (!textoBusqueda.trim()) {
      setClientesFiltrados(clientes);
    } else {
      const textoLower = textoBusqueda.toLowerCase().trim();
      const filtradas = clientes.filter(
        (cli) =>
          cli.nombre_cliente.toLowerCase().includes(textoLower) ||
          (cli.descripcion_cliente && cli.descripcion_cliente.toLowerCase().includes(textoLower))
      );
      setClientesFiltrados(filtradas);
    }
  }, [textoBusqueda, clientes]);

  const abrirModalEdicion = (cliente) => {
    setClienteEditar({
      id_cliente: cliente.id_cliente,
      nombre_cliente: cliente.nombre_cliente,
      apellido_cliente: cliente.apellido_cliente,
      direccion_cliente: cliente.direccion_cliente,
      telefono_cliente: cliente.telefono_cliente,
    });
    setMostrarModalEdicion(true);
  };

  const abrirModalEliminacion = (cliente) => {
    setClienteAEliminar(cliente);
    setMostrarModalEliminacion(true);
  };

  const manejoCambioInputEdicion = (e) => {
    const { name, value } = e.target;
    setClienteEditar((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const manejoCambioInput = (e) => {
    const { name, value } = e.target;
    setNuevoCliente((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const agregarCliente = async () => {
    try {
      if (
        !nuevoCliente.nombre_cliente.trim() ||
        !nuevoCliente.apellido_cliente.trim() ||
        !nuevoCliente.direccion_cliente.trim() ||
        !nuevoCliente.telefono_cliente.trim()
      ) {
        setToast({
          mostrar: true,
          mensaje: "Debe llenar todos los campos.",
          tipo: "advertencia",
        });
        return;
      }

      const { data, error } = await supabase
        .from("clientes")
        .insert([
          {
            nombre_cliente: nuevoCliente.nombre_cliente,
            apellido_cliente: nuevoCliente.apellido_cliente,
            direccion_cliente: nuevoCliente.direccion_cliente,
            telefono_cliente: nuevoCliente.telefono_cliente,
          },
        ])
        .select();

      if (error) {
        console.error("Error al agregar cliente:", error.message);
        setToast({
          mostrar: true,
          mensaje: "Error al registrar cliente.",
          tipo: "error",
        });
        return;
      }

      console.log("Cliente creado:", data);

      // Éxito
      setToast({
        mostrar: true,
        mensaje: `Cliente "${nuevoCliente.nombre_cliente}" registrado exitosamente.`,
        tipo: "exito",
      });

      await cargarClientes();

      // Limpiar formulario y cerrar modal
      setNuevoCliente({ nombre_cliente: "", descripcion_cliente: "" });
      setMostrarModal(false);
    } catch (err) {
      console.error("Excepción al agregar cliente:", err.message);
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al registrar cliente.",
        tipo: "error",
      });
    }
  };

  const actualizarCliente = async () => {
    try {
      if (
        !clienteEditar.nombre_cliente.trim() ||
        !clienteEditar.apellido_cliente.trim() ||
        !clienteEditar.direccion_cliente.trim() ||
        !clienteEditar.telefono_cliente.trim()
      ) {
        setToast({
          mostrar: true,
          mensaje: "Debe llenar todos los campos.",
          tipo: "advertencia",
        });
        return;
      }

      const { error } = await supabase
        .from("clientes")
        .update({
          nombre_cliente: clienteEditar.nombre_cliente,
          apellido_cliente: clienteEditar.apellido_cliente,
          direccion_cliente: clienteEditar.direccion_cliente,
          telefono_cliente: clienteEditar.telefono_cliente,
        })
        .eq("id_cliente", clienteEditar.id_cliente)
        .select();

      if (error) {
        console.error("Error al actualizar cliente:", error.message);
        setToast({
          mostrar: true,
          mensaje: "Error al actualizar cliente.",
          tipo: "error",
        });
        return;
      }

      setMostrarModalEdicion(false);

      await cargarClientes();

      setToast({
        mostrar: true,
        mensaje: `Cliente "${clienteEditar.nombre_cliente}" actualizado exitosamente.`,
        tipo: "exito",
      });
    } catch (err) {
      console.error("Excepción al actualizar cliente:", err.message);
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al actualizar cliente.",
        tipo: "error",
      });
      console.error("Error al actualizar cliente:", err.message);
    }
  };

  const eliminarCliente = async () => {
    if (!clienteAEliminar) return;
    try {
      setMostrarModalEliminacion(false);
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id_cliente", clienteAEliminar.id_cliente)
        .select();

      if (error) {
        console.error("Error al eliminar cliente:", error.message);
        setToast({
          mostrar: true,
          mensaje: `Error al eliminar cliente "${clienteAEliminar.nombre_cliente}": ${error.message}`,
          tipo: "error",
        });
        return;
      }

      await cargarClientes();
      setToast({
        mostrar: true,
        mensaje: `Cliente "${clienteAEliminar.nombre_cliente}" eliminado exitosamente.`,
        tipo: "exito",
      });
    } catch (err) {
      console.error("Excepción al eliminar cliente:", err.message);
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al eliminar cliente.",
        tipo: "error",
      });
      console.error("Error al eliminar cliente:", err.message);
    }
  };

  return (
    <Container fluid className="vista-contenedor px-3 px-md-4">
      <EncabezadoVista
        titulo="Clientes"
        icono="bi bi-people-fill"
        subtitulo="Gestiona la información de tus clientes"
        acciones={
          <Button
            onClick={() => setMostrarModal(true)}
            className="btn-marca"
            size="md"
          >
            <i className="bi-plus-lg"></i>
            <span className="d-none d-sm-inline ms-2">Nuevo Cliente</span>
          </Button>
        }
      />

      <Row className="mb-4">
        <Col md={6} lg={5}>
          <CuadroBusquedas
            textoBusqueda={textoBusqueda}
            manejarCambioBusqueda={manejarBusqueda}
            placeholder="Buscar por nombre o descripción..."
          />
        </Col>
      </Row>

      {/* Mensaje cuando no se encuentran clientes */}
      {!cargando && textoBusqueda.trim() && clientesFiltrados.length === 0 && (
          <Row className="mb-4">
            <Col>
              <Alert variant="info" className="text-center alerta-marca">
                <i className="bi-info-circle me-2"></i>
                No se encontraron clientes que coincidan con la búsqueda.
              </Alert>
            </Col>
          </Row>
        )}

      {}
      {!cargando && textoBusqueda.trim() && clientesFiltrados.length > 0 && (
        <Row>
          <Col xs={12} sm={12} md={12} className="d-lg-none">
            <TarjetaCliente
              clientes={clientesPaginados}
              abrirModalEdicion={abrirModalEdicion}
              abrirModalEliminacion={abrirModalEliminacion}
            />
          </Col>
          <Col lg={12} className="d-none d-lg-block">
            <div className="vista-panel">
              <TablaClientes
              clientes={clientesFiltrados}
              abrirModalEdicion={abrirModalEdicion}
              abrirModalEliminacion={abrirModalEliminacion}
            />
            </div>
          </Col>
        </Row>
      )}


      {/* Spinner mientras se cargan las categorías */}
      {cargando && (
        <Row className="text-center my-5 carga-marca">
          <Col>
            <Spinner animation="border" size="lg" />
            <p className="mt-3">Cargando clientes...</p>
          </Col>
        </Row>
      )}

      <Row className="d-lg-none">
        <Col xs={12}>
          <TarjetaCliente
            clientes={clientesPaginados}
            abrirModalEdicion={abrirModalEdicion}
            abrirModalEliminacion={abrirModalEliminacion}
          />
        </Col>
      </Row>

       {/* Lista de clientes cargados */}
      {!cargando && !textoBusqueda.trim() && clientes.length > 0 &&  (
        <Row>
          <Col lg={12} className="d-none d-lg-block">
            <div className="vista-panel">
              <TablaClientes
              clientes={clientes}

              abrirModalEdicion={abrirModalEdicion}
              abrirModalEliminacion={abrirModalEliminacion}
            />
            </div>
          </Col>
        </Row>
      )}

       {/* Paginación */}
      {clientesFiltrados.length > 0 && (
        <Paginacion
          registroPorPagina={registroPorPagina}
          totalRegistros={clientesFiltrados.length}
          PaginaActual={PaginaActual}
          establecerPaginaActual={establecerPaginaActual}
          establecerRegistroPorPagina={establecerRegistroPorPagina}
        />
      )}

      {/* Modal de Registro */}
      <ModalRegistroCliente
        mostrarModal={mostrarModal}
        setMostrarModal={setMostrarModal}
        nuevoCliente={nuevoCliente}
        manejoCambioInput={manejoCambioInput}
        agregarCliente={agregarCliente}
      />

      {/* Modal de Edición */}
      <ModalEdicionCliente
        mostrarModalEdicion={mostrarModalEdicion}
        setMostrarModalEdicion={setMostrarModalEdicion}
        clienteEditar={clienteEditar}
        manejoCambioInputEdicion={manejoCambioInputEdicion}
        actualizarCliente={actualizarCliente}
      />

      {/* Modal de Eliminación */}
      <ModalEliminacionCliente
        mostrarModalEliminacion={mostrarModalEliminacion}
        setMostrarModalEliminacion={setMostrarModalEliminacion}
        eliminarCliente={eliminarCliente}
        cliente={clienteAEliminar}
      />

      {/* Notificación */}
      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onCerrar={() => setToast((prev) => ({ ...prev, mostrar: false }))}
      />
    </Container>
  );
};

export default Clientes;