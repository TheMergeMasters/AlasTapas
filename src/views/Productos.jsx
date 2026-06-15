import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Alert, Spinner } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import ModalRegistroProducto from "../components/productos/ModalRegisProducto";
import TablaProductos from "../components/productos/TablaProductos";
import ModalEdicionProducto from "../components/productos/ModalEdicionProducto";
import ModalEliminacionProducto from "../components/productos/ModalEliminacionProducto";
import Paginacion from "../components/ordenamiento/Paginacion";
import NotificacionOperacion from "../components/NotificacionOperacion";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import TarjetaProducto from "../components/productos/TarjetasProductos";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ModalQRProducto from "../components/productos/ModalQRProducto";
import EncabezadoVista from "../components/layout/EncabezadoVista";

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre_producto: "",
    descripcion_producto: "",
    categoria_producto: "",
    precio_costo: "",
    stock: "",
    archivo: null,
  });

  const [registrosPorPagina, establecerRegistrosPorPagina] = useState(5); // Registros por página
  const [paginaActual, establecerPaginaActual] = useState(1);

  const productosPaginados = productosFiltrados.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina,
  );

  const [productoEditar, setProductoEditar] = useState({
    id_producto: "",
    nombre_producto: "",
    descripcion_producto: "",
    categoria_producto: "",
    precio_costo: "",
    stock: "",
    url_imagen: "",
    archivo: null,
  });

  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

  const manejoCambioInput = (e) => {
    const { name, value } = e.target;
    setNuevoProducto((prev) => ({ ...prev, [name]: value }));
  };

  const manejoCambioArchivo = (e) => {
    const archivo = e.target.files[0];
    if (archivo && archivo.type.startsWith("image/")) {
      setNuevoProducto((prev) => ({ ...prev, archivo }));
    } else {
      alert("Selecciona una imagen válida (JPG, PNG, etc.)");
    }
  };

  const manejarBusqueda = (e) => {
    setTextoBusqueda(e.target.value);
  };

  useEffect(() => {
    if (!textoBusqueda.trim()) {
      setProductosFiltrados(productos);
    } else {
      const textoLower = textoBusqueda.toLowerCase().trim();
      const filtrados = productos.filter((prod) => {
        const nombre = prod.nombre_producto?.toLowerCase() || "";
        const descripcion = prod.descripcion_producto?.toLowerCase() || "";
        const precio = prod.precio_costo?.toString() || "";

        return (
          nombre.includes(textoLower) ||
          descripcion.includes(textoLower) ||
          precio.includes(textoLower)
        );
      });
      setProductosFiltrados(filtrados);
    }
  }, [textoBusqueda, productos]);

  useEffect(() => {
    const totalPaginas = Math.max(
      1,
      Math.ceil((productosFiltrados.length || 0) / registrosPorPagina),
    );
    if (paginaActual > totalPaginas) {
      establecerPaginaActual(1);
    }
  }, [productosFiltrados, registrosPorPagina, paginaActual]);

  useEffect(() => {
    cargarCategorias();
    cargarProductos();
  }, []);

  const cargarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("id_categoria", { ascending: true });
      if (error) throw error;
      setCategorias(data || []);
    } catch (err) {
      console.error("Error al cargar categorias:", err);
    }
  };

  const cargarProductos = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .order("id_producto", { ascending: true });
      if (error) throw error;
      setProductos(data || []);
      setProductosFiltrados(data || []);
    } catch (err) {
      console.error("Error al cargar productos:", err);
    } finally {
      setCargando(false);
    }
  };

  const agregarProducto = async () => {
    try {
      if (
        !nuevoProducto.nombre_producto.trim() ||
        !nuevoProducto.categoria_producto ||
        !nuevoProducto.precio_costo ||
        !nuevoProducto.stock ||
        !nuevoProducto.archivo
      ) {
        setToast({
          mostrar: true,
          mensaje:
            "Completa los campos obligatorios (nombre, categoría, precio, stock e imagen)",
          tipo: "advertencia",
        });
        return;
      }

      setMostrarModal(false);

      const nombreArchivo = `${Date.now()}_${nuevoProducto.archivo.name}`;

      const { error: uploadError } = await supabase.storage
        .from("imagenes_productos")
        .upload(nombreArchivo, nuevoProducto.archivo, {});

      if (uploadError) throw uploadError;

      const { data: urlData } = await supabase.storage
        .from("imagenes_productos")
        .getPublicUrl(nombreArchivo);
      const urlPublica = urlData.publicUrl;

      const { error } = await supabase.from("productos").insert([
        {
          nombre_producto: nuevoProducto.nombre_producto,
          descripcion_producto: nuevoProducto.descripcion_producto || null,
          categoria_producto: parseInt(nuevoProducto.categoria_producto),
          precio_costo: parseFloat(nuevoProducto.precio_costo),
          stock: parseInt(nuevoProducto.stock),
          url_imagen: urlPublica,
        },
      ]);

      if (error) throw error;

      // Recargar la lista de productos
      await cargarProductos();

      setNuevoProducto({
        nombre_producto: "",
        descripcion_producto: "",
        categoria_producto: "",
        precio_costo: "",
        stock: "",
        archivo: null,
      });

      setToast({
        mostrar: true,
        mensaje: "Producto registrado correctamente",
        tipo: "exito",
      });
    } catch (err) {
      console.error("Error al agregar producto:", err);
      setToast({
        mostrar: true,
        mensaje: `Error: ${err.message || "Error al registrar producto"}`,
        tipo: "error",
      });
    }
  };

  const abrirModalEdicion = (producto) => {
    setProductoEditar({
      id_producto: producto.id_producto,
      nombre_producto: producto.nombre_producto ?? producto.nombre ?? "",
      descripcion_producto:
        producto.descripcion_producto ?? producto.descripcion ?? "",
      categoria_producto:
        producto.categoria_producto ?? producto.categoria ?? "",
      precio_costo: producto.precio_costo ?? producto.precio ?? "",
      stock: producto.stock ?? "",
      url_imagen: producto.url_imagen ?? producto.imagen ?? "",
      archivo: null,
    });
    setMostrarModalEdicion(true);
  };

  const abrirModalEliminacion = (producto) => {
    setProductoAEliminar(producto);
    setMostrarModalEliminacion(true);
  };

  const manejoCambioInputEdicion = (e) => {
    const { name, value } = e.target;
    setProductoEditar((prev) => ({ ...prev, [name]: value }));
  };

  const manejoCambioArchivoEdicion = (e) => {
    const archivo = e.target.files[0];
    if (archivo && archivo.type.startsWith("image/")) {
      setProductoEditar((prev) => ({ ...prev, archivo }));
    } else {
      alert("Selecciona una imagen válida (JPG, PNG, etc.)");
    }
  };

  const actualizarProducto = async () => {
    try {
      if (
        !productoEditar.nombre_producto.trim() ||
        !productoEditar.categoria_producto ||
        !productoEditar.precio_costo ||
        !productoEditar.stock
      ) {
        setToast({
          mostrar: true,
          mensaje: "Complete los campos obligatorios",
          tipo: "advertencia",
        });
        return;
      }

      setMostrarModalEdicion(false);

      let urlPublica = productoEditar.url_imagen;

      if (productoEditar.archivo) {
        const nombreArchivo = `${Date.now()}_${productoEditar.archivo.name}`;
        const { error: uploadError } = await supabase.storage
          .from("imagenes_productos")
          .upload(nombreArchivo, productoEditar.archivo, {});
        if (uploadError) throw uploadError;

        const { data: urlData } = await supabase.storage
          .from("imagenes_productos")
          .getPublicUrl(nombreArchivo);
        urlPublica = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("productos")
        .update({
          nombre_producto: productoEditar.nombre_producto,
          descripcion_producto: productoEditar.descripcion_producto || null,
          categoria_producto: productoEditar.categoria_producto,
          precio_costo: parseFloat(productoEditar.precio_costo),
          stock: parseInt(productoEditar.stock),
          url_imagen: urlPublica,
        })
        .eq("id_producto", productoEditar.id_producto)
        .select();

      if (error) throw error;

      await cargarProductos();
      setToast({
        mostrar: true,
        mensaje: "Producto actualizado correctamente",
        tipo: "exito",
      });
    } catch (err) {
      console.error("Error al actualizar producto:", err);
      setToast({
        mostrar: true,
        mensaje: "Error al actualizar producto",
        tipo: "error",
      });
    }
  };

  const eliminarProducto = async () => {
    if (!productoAEliminar) return;
    try {
      setMostrarModalEliminacion(false);
      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id_producto", productoAEliminar.id_producto)
        .select();

      if (error) throw error;

      await cargarProductos();
      setToast({
        mostrar: true,
        mensaje: `Producto "${productoAEliminar.nombre_producto}" eliminado`,
        tipo: "exito",
      });
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      setToast({
        mostrar: true,
        mensaje: "Error al eliminar producto",
        tipo: "error",
      });
    }
  };

  const generarPDF = async () => {
    try {
      if (productosFiltrados.length === 0) {
        setToast({
          mostrar: true,
          mensaje: "No hay productos para exportar",
          tipo: "advertencia",
        });
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Título principal
      doc.setFontSize(22);
      doc.setFont(undefined, "bold");
      doc.text("Catálogo de Productos", 14, yPosition);
      yPosition += 8;

      // Subtítulo con nombre de la empresa
      doc.setFontSize(14);
      doc.setFont(undefined, "normal");
      doc.setTextColor(150, 0, 0);
      doc.text("AlasTapas", 14, yPosition);
      yPosition += 8;

      // Línea decorativa
      doc.setDrawColor(200, 0, 0);
      doc.setLineWidth(1);
      doc.line(14, yPosition, pageWidth - 14, yPosition);
      yPosition += 8;

      // Información de generación
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont(undefined, "normal");
      doc.text(
        `Generado: ${new Date().toLocaleDateString("es-ES")} | Total de productos: ${productosFiltrados.length}`,
        14,
        yPosition,
      );
      doc.setTextColor(0, 0, 0);
      yPosition += 12;

      // Iterar sobre los productos
      for (let i = 0; i < productosFiltrados.length; i++) {
        const producto = productosFiltrados[i];
        const categoria = categorias.find(
          (cat) => cat.id_categoria === producto.categoria_producto,
        );

        // Verificar si hay espacio suficiente
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 20;
        }

        // Contenedor para la tarjeta del producto
        const cardHeight = 58;
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.rect(14, yPosition - 5, pageWidth - 28, cardHeight);

        // Agregar imagen del producto
        const imgX = 19;
        const imgWidth = 48;
        const imgHeight = 48;

        if (producto.url_imagen) {
          try {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = producto.url_imagen;

            await new Promise((resolve, reject) => {
              img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                const imgData = canvas.toDataURL("image/jpeg");

                doc.addImage(
                  imgData,
                  "JPEG",
                  imgX,
                  yPosition - 2,
                  imgWidth,
                  imgHeight,
                );
                resolve();
              };
              img.onerror = () => resolve(); // Continuar sin imagen si hay error
            });
          } catch (err) {
            console.error("Error procesando imagen:", err);
          }
        }

        // Información del producto (lado derecho)
        const infoX = imgX + imgWidth + 8;
        const infoWidth = pageWidth - infoX - 16;

        // Nombre del producto
        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        doc.setTextColor(50, 50, 50);
        const nombreArray = doc.splitTextToSize(
          producto.nombre_producto,
          infoWidth,
        );
        doc.text(nombreArray, infoX, yPosition + 3);
        let textY = yPosition + 3 + nombreArray.length * 5;

        // Detalles en tabla
        doc.setFontSize(9);
        doc.setFont(undefined, "normal");
        doc.setTextColor(70, 70, 70);

        // Categoría
        doc.setFont(undefined, "bold");
        doc.text("Categoría:", infoX, textY);
        doc.setFont(undefined, "normal");
        doc.text(categoria?.nombre_categoria || "N/A", infoX + 28, textY);
        textY += 5;

        // Precio
        doc.setFont(undefined, "bold");
        doc.setTextColor(200, 0, 0);
        doc.text("Precio:", infoX, textY);
        doc.setFont(undefined, "bold");
        doc.text(`$${producto.precio_costo.toFixed(2)}`, infoX + 28, textY);
        textY += 5;

        // Stock
        doc.setFont(undefined, "bold");
        doc.setTextColor(0, 100, 0);
        doc.text("Stock:", infoX, textY);
        doc.setFont(undefined, "normal");
        doc.setTextColor(70, 70, 70);
        doc.text(`${producto.stock} unidades`, infoX + 28, textY);

        // Descripción si existe
        if (producto.descripcion_producto) {
          textY += 8;
          doc.setFontSize(9);
          doc.setFont(undefined, "normal");
          doc.setTextColor(50, 50, 50);
          const descArray = doc.splitTextToSize(
            producto.descripcion_producto,
            infoWidth,
          );
          doc.text(descArray, infoX, textY);
        }

        // Espacio entre productos
        yPosition += cardHeight + 8;
        doc.setTextColor(0, 0, 0);
      }

      // Pie de página
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "Este catálogo fue generado automáticamente por el sistema AlasTapas",
        14,
        pageHeight - 10,
      );

      // Descargar PDF
      doc.save("catalogo_productos_alastapas.pdf");

      setToast({
        mostrar: true,
        mensaje: "PDF generado correctamente",
        tipo: "exito",
      });
    } catch (err) {
      console.error("Error al generar PDF:", err);
      setToast({
        mostrar: true,
        mensaje: "Error al generar el PDF",
        tipo: "error",
      });
    }
  };

  const generarPDFProducto = async (producto) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const categoria = categorias.find(
        (cat) => cat.id_categoria === producto.categoria_producto,
      );

      // Título
      doc.setFontSize(22);
      doc.setFont(undefined, "bold");
      doc.text("Ficha de Producto", 14, 20);

      // Subtítulo con nombre de la empresa
      doc.setFontSize(14);
      doc.setFont(undefined, "normal");
      doc.setTextColor(150, 0, 0);
      doc.text("AlasTapas", 14, 28);
      doc.setTextColor(0, 0, 0);

      // Línea decorativa
      doc.setDrawColor(200, 0, 0);
      doc.setLineWidth(1);
      doc.line(14, 32, pageWidth - 14, 32);

      let yPosition = 42;
      const imgWidth = 80;
      const imgHeight = 80;

      // Agregar imagen del producto
      if (producto.url_imagen) {
        try {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = producto.url_imagen;

          await new Promise((resolve, reject) => {
            img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0);
              const imgData = canvas.toDataURL("image/jpeg");

              doc.addImage(imgData, "JPEG", 14, yPosition, imgWidth, imgHeight);
              resolve();
            };
            img.onerror = () => resolve();
          });
        } catch (err) {
          console.error("Error procesando imagen:", err);
        }
      }

      // Información del producto (lado derecho de la imagen)
      const infoX = 100;
      let infoY = yPosition;

      // Nombre
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.setTextColor(50, 50, 50);
      doc.text(producto.nombre_producto, infoX, infoY);

      // ID
      infoY += 10;
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.setTextColor(70, 70, 70);
      doc.text(`ID: ${producto.id_producto}`, infoX, infoY);

      // Categoría
      infoY += 7;
      doc.setFont(undefined, "bold");
      doc.text("Categoría:", infoX, infoY);
      doc.setFont(undefined, "normal");
      doc.text(categoria?.nombre_categoria || "N/A", infoX + 35, infoY);

      // Precio
      infoY += 7;
      doc.setFont(undefined, "bold");
      doc.setTextColor(200, 0, 0);
      doc.text("Precio:", infoX, infoY);
      doc.text(`$${producto.precio_costo.toFixed(2)}`, infoX + 35, infoY);

      // Stock
      infoY += 7;
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 100, 0);
      doc.text("Stock:", infoX, infoY);
      doc.setTextColor(70, 70, 70);
      doc.text(`${producto.stock} unidades`, infoX + 35, infoY);

      // Descripción (debajo del stock y la imagen)
      let descY = infoY + 20;
      if (yPosition + imgHeight > descY) {
        descY = yPosition + imgHeight + 15;
      }

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Descripción:", 14, descY);

      descY += 8;
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.setTextColor(50, 50, 50);

      if (producto.descripcion_producto) {
        const descArray = doc.splitTextToSize(
          producto.descripcion_producto,
          pageWidth - 28,
        );
        doc.text(descArray, 14, descY);
      } else {
        doc.text("Sin descripción disponible", 14, descY);
      }

      // Pie de página
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generado: ${new Date().toLocaleDateString("es-ES")} | AlasTapas`,
        14,
        doc.internal.pageSize.getHeight() - 10,
      );

      // Descargar PDF
      doc.save(
        `producto_${producto.id_producto}_${producto.nombre_producto}.pdf`,
      );

      setToast({
        mostrar: true,
        mensaje: `PDF de "${producto.nombre_producto}" generado correctamente`,
        tipo: "exito",
      });
    } catch (err) {
      console.error("Error al generar PDF del producto:", err);
      setToast({
        mostrar: true,
        mensaje: "Error al generar el PDF",
        tipo: "error",
      });
    }
  };

  const copiarProducto = async (producto) => {
    if (!producto) return;

    const categoria = categorias.find(
      (cat) => cat.id_categoria === producto.categoria_producto,
    );
    const texto = `ID: ${producto.id_producto}\nNombre: ${producto.nombre_producto}\nCategoría: ${categoria?.nombre_categoria || producto.categoria_producto}\nPrecio: $${producto.precio_costo}\nStock: ${producto.stock}\nDescripción: ${producto.descripcion_producto || 'Sin descripción'}`;

    try {
      await navigator.clipboard.writeText(texto);
      setToast({
        mostrar: true,
        mensaje: `Producto "${producto.nombre_producto}" copiado al portapapeles`,
        tipo: "exito",
      });
    } catch (err) {
      console.error("Error al copiar producto:", err);
      setToast({
        mostrar: true,
        mensaje: "No se pudo copiar al portapapeles",
        tipo: "error",
      });
    }
  };

  const [mostrarModalQR, setMostrarModalQR] = useState(false);
  const [productoQR, setProductoQR] = useState(null);

  const generarQRImagen = (producto) => {
    if (!producto?.url_imagen) {
      setToast({
        mostrar: true,
        mensaje: "Este producto no tiene imagen asociada",
        tipo: "advertencia",
      });
      return;
    }

    setProductoQR(producto);
    setMostrarModalQR(true);
  };

  return (
    <Container fluid className="vista-contenedor px-3 px-md-4">
      <EncabezadoVista
        titulo="Productos"
        icono="bi bi-bag-heart-fill"
        subtitulo="Administra el catálogo de productos del negocio"
        acciones={
          <>
            <Button
              onClick={generarPDF}
              className="btn-marca-outline"
              size="md"
              title="Exportar catálogo en PDF"
            >
              <i className="bi-file-pdf"></i>
              <span className="d-none d-sm-inline ms-2">Exportar PDF</span>
            </Button>
            <Button
              onClick={() => setMostrarModal(true)}
              className="btn-marca"
              size="md"
            >
              <i className="bi-plus-lg"></i>
              <span className="d-none d-sm-inline ms-2">Nuevo Producto</span>
            </Button>
          </>
        }
      />

      <Row className="mb-4">
        <Col md={6} lg={5}>
          <CuadroBusquedas
            textoBusqueda={textoBusqueda}
            manejarCambioBusqueda={manejarBusqueda}
            placeholder="Buscar por nombre, descripción o precio..."
          />
        </Col>
      </Row>

      <Row>
        <Col xs={12} sm={12} md={12} className="d-lg-none">
          <TarjetaProducto
            productos={productosFiltrados}
            categorias={categorias}
            abrirModalEdicion={abrirModalEdicion}
            abrirModalEliminacion={abrirModalEliminacion}
            generarQRImagen={generarQRImagen}
            copiarProducto={copiarProducto}
          />
        </Col>
      </Row>

      <Row>
        <Col className="d-none d-lg-block">
          <div className="vista-panel">
            <TablaProductos
            productos={productosFiltrados.slice(
              (paginaActual - 1) * registrosPorPagina,
              paginaActual * registrosPorPagina,
            )}
            categorias={categorias}
            cargando={cargando}
            abrirModalEdicion={abrirModalEdicion}
            abrirModalEliminacion={abrirModalEliminacion}
            generarPDFProducto={generarPDFProducto}
            generarQRImagen={generarQRImagen}
            copiarProducto={copiarProducto}
          />
          </div>
        </Col>
      </Row>

      {productosFiltrados.length > 0 && (
        <Row className="mt-3">
          <Col>
            <Paginacion
              registrosPorPagina={registrosPorPagina}
              totalRegistros={productosFiltrados.length}
              paginaActual={paginaActual}
              establecerPaginaActual={establecerPaginaActual}
              establecerRegistrosPorPagina={establecerRegistrosPorPagina}
            />
          </Col>
        </Row>
      )}

      {/* Modales */}

      <ModalRegistroProducto
        mostrarModal={mostrarModal}
        setMostrarModal={setMostrarModal}
        nuevoProducto={nuevoProducto}
        manejoCambioInput={manejoCambioInput}
        manejoCambioArchivo={manejoCambioArchivo}
        agregarProducto={agregarProducto}
        categorias={categorias}
      />

      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onCerrar={() => setToast({ ...toast, mostrar: false })}
      />
      <ModalQRProducto
        mostrar={mostrarModalQR}
        onHide={() => setMostrarModalQR(false)}
        producto={productoQR}
      />
      <ModalEdicionProducto
        mostrarModalEdicion={mostrarModalEdicion}
        setMostrarModalEdicion={setMostrarModalEdicion}
        productoEditar={productoEditar}
        manejoCambioInputEdicion={manejoCambioInputEdicion}
        manejoCambioArchivoEdicion={manejoCambioArchivoEdicion}
        actualizarProducto={actualizarProducto}
        categorias={categorias}
      />

      <ModalEliminacionProducto
        mostrarModalEliminacion={mostrarModalEliminacion}
        setMostrarModalEliminacion={setMostrarModalEliminacion}
        productoAEliminar={productoAEliminar}
        eliminarProducto={eliminarProducto}
      />
    </Container>
  );
};

export default Productos;