import React, { useEffect, useState, useRef } from "react";
import { Container, Row, Col, Card, Spinner, Form, Button } from "react-bootstrap";
import { Chart as ChartJS, registerables } from "chart.js";
import { supabase } from "../database/supabaseconfig";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import EncabezadoVista from "../components/layout/EncabezadoVista";

ChartJS.register(...registerables);

const COLORES = [
  "#1068db",
  "#2697cc",
  "#1e3d87",
  "#5ea5f1",
  "#198754",
  "#e27d01",
];

const Inicio = () => {
  const [cargando, setCargando] = useState(true);

  const [fechaDesde, setFechaDesde] = useState(
    new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Managua",
    }),
  );

  const [fechaHasta, setFechaHasta] = useState(
    new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Managua",
    }),
  );

  const [estadisticas, setEstadisticas] = useState({
    totalVentas: 0,
    ventasEfectivo: 0,
    ventasTarjeta: 0,
    cantidadOrdenes: 0,
    cantidadVentas: 0,
    productosVendidos: 0,
    montoProductos: 0,
    ventasPorHora: [],
    ventasPorCategoria: [],
  });

  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);

  const lineChartInstance = useRef(null);
  const pieChartInstance = useRef(null);

  const graficoHoraRef = useRef(null);
  const graficoCategoriasRef = useRef(null);

  useEffect(() => {
    cargarDatos(fechaDesde, fechaHasta);
  }, [fechaDesde, fechaHasta]);

  useEffect(() => {
    if (cargando) return;

    if (lineChartRef.current) {
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }

      const labels = estadisticas.ventasPorHora.map((v) => v.hora);
      const data = estadisticas.ventasPorHora.map((v) => v.total);

      lineChartInstance.current = new ChartJS(lineChartRef.current, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Ventas (C$)",
              data,
              borderColor: "#1068db",
              backgroundColor: "rgba(16,104,219,0.1)",
              borderWidth: 3,
              pointRadius: 5,
              pointBackgroundColor: "#1068db",
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
        },
      });
    }

    if (pieChartRef.current) {
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
        pieChartInstance.current = null;
      }

      if (estadisticas.ventasPorCategoria.length > 0) {
        pieChartInstance.current = new ChartJS(pieChartRef.current, {
          type: "doughnut",
          data: {
            labels: estadisticas.ventasPorCategoria.map((c) => c.name),
            datasets: [
              {
                data: estadisticas.ventasPorCategoria.map((c) => c.value),
                backgroundColor: estadisticas.ventasPorCategoria.map(
                  (_, i) => COLORES[i % COLORES.length],
                ),
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "bottom" },
            },
          },
        });
      }
    }

    return () => {
      lineChartInstance.current?.destroy();
      pieChartInstance.current?.destroy();
    };
  }, [estadisticas, cargando]);

  const cargarDatos = async (desde, hasta) => {
    try {
      setCargando(true);

      const inicioRango = `${desde} 00:00:00`;
      const finRango = `${hasta} 23:59:59`;

      const { data: categorias } = await supabase
        .from("categorias")
        .select("*");

      const categoriasMap = {};

      categorias?.forEach((cat) => {
        categoriasMap[cat.id_categoria] = cat.nombre_categoria;
      });

      const { data: productos } = await supabase.from("productos").select("*");

      const productoCategoriaMap = {};

      productos?.forEach((p) => {
        productoCategoriaMap[Number(p.id_producto)] =
          categoriasMap[p.categoria_producto] || "Sin categoría";
      });

      const { data: ordenes, error: errorOrdenes } = await supabase
        .from("ordenes")
        .select("id_orden, fecha_orden")
        .gte("fecha_orden", inicioRango)
        .lte("fecha_orden", finRango);

      if (errorOrdenes) throw errorOrdenes;

      const idsOrdenes = ordenes?.map((o) => o.id_orden) || [];

      if (idsOrdenes.length === 0) {
        setEstadisticas({
          totalVentas: 0,
          ventasEfectivo: 0,
          ventasTarjeta: 0,
          cantidadOrdenes: 0,
          cantidadVentas: 0,
          productosVendidos: 0,
          montoProductos: 0,
          ventasPorHora: [],
          ventasPorCategoria: [],
        });

        return;
      }

      const { data: ventas, error: errorVentas } = await supabase
        .from("ventas")
        .select("*")
        .in("id_orden", idsOrdenes);

      if (errorVentas) throw errorVentas;

      const { data: detalles, error: errorDetalles } = await supabase
        .from("detalles_ordenes")
        .select("*")
        .in("id_orden", idsOrdenes);

      if (errorDetalles) throw errorDetalles;

      let productosVendidos = 0;

      const ventasCategoriaObj = {};

      detalles?.forEach((det) => {
        productosVendidos += Number(det.cantidad || 0);

        const idProducto = Number(det.nombre_producto);
        const categoria =
          productoCategoriaMap[idProducto] || "Sin categoría";

        ventasCategoriaObj[categoria] =
          (ventasCategoriaObj[categoria] || 0) + Number(det.cantidad || 0);
      });

      const ventasPorCategoria = Object.entries(ventasCategoriaObj).map(
        ([name, value]) => ({
          name,
          value,
        }),
      );

      const totalVentas = ventas.reduce(
        (sum, v) => sum + Number(v.total_venta || 0),
        0,
      );

      const horaMap = Array(24).fill(0);

      ordenes.forEach((orden) => {
        const hora = new Date(orden.fecha_orden).getHours();

        const venta = ventas.find((v) => v.id_orden === orden.id_orden);

        if (venta) {
          horaMap[hora] += Number(venta.total_venta || 0);
        }
      });

      const ventasPorHora = [];

      for (let i = 0; i < 24; i++) {
        ventasPorHora.push({
          hora: `${i.toString().padStart(2, "0")}:00`,
          total: horaMap[i],
        });
      }

      setEstadisticas({
        totalVentas,
        ventasEfectivo: 0,
        ventasTarjeta: 0,
        cantidadOrdenes: ordenes.length,
        cantidadVentas: ventas.length,
        productosVendidos,
        montoProductos: totalVentas,
        ventasPorHora,
        ventasPorCategoria,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const descargarExcel = async () => {
    try {
      setCargando(true);

      const { data: ventas } = await supabase
        .from("ventas")
        .select("*")
        .order("id_venta", { ascending: false });

      const { data: detalles } = await supabase
        .from("detalles_ordenes")
        .select("*");

      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          ventas?.length ? ventas : [{ Mensaje: "No hay ventas registradas" }],
        ),
        "Ventas",
      );

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          detalles?.length
            ? detalles
            : [{ Mensaje: "No hay detalles registrados" }],
        ),
        "Detalles_Ordenes",
      );

      XLSX.writeFile(wb, `Reporte_Ventas_${fechaDesde}_${fechaHasta}.xlsx`);
    } catch (error) {
      console.error(error);
      alert("Error al generar Excel");
    } finally {
      setCargando(false);
    }
  };
  const generarPdfVentasHora = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");

      // Título y fecha
      pdf.setFontSize(18);
      pdf.setTextColor("#330775");
      pdf.setFont("helvetica", "bold");
      pdf.text("Reporte de Ventas por Hora", 14, 15);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor("#000000");
      pdf.setFontSize(10);
      pdf.text(`Periodo: ${fechaDesde} - ${fechaHasta}`, 14, 22);

      // Imagen del gráfico
      const canvas = await html2canvas(graficoHoraRef.current);
      const imagen = canvas.toDataURL("image/png");
      pdf.addImage(imagen, "PNG", 10, 30, 190, 80);

      // Resumen
      pdf.setFontSize(14);
      pdf.setTextColor("#330775");
      pdf.setFont("helvetica", "bold");
      pdf.text("Resumen General", 14, 115);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor("#000000");
      pdf.setFontSize(10);

      pdf.text(
        `Total Ventas: C$ ${estadisticas.totalVentas.toFixed(2)}`,
        14,
        125,
      );

      pdf.text(
        `Ventas Efectivo: C$ ${estadisticas.ventasEfectivo.toFixed(2)}`,
        14,
        132,
      );

      pdf.text(
        `Ventas Tarjeta: C$ ${estadisticas.ventasTarjeta.toFixed(2)}`,
        14,
        139,
      );

      pdf.text(
        `Productos Vendidos: ${estadisticas.productosVendidos}`,
        14,
        146,
      );

      pdf.text(`Cantidad Ventas: ${estadisticas.cantidadVentas}`, 14, 153);

      // Tabla
      const filas = estadisticas.ventasPorHora.map((item) => [
        item.hora,
        `C$ ${item.total}`,
      ]);

      autoTable(pdf, {
        startY: 160,
        head: [["Hora", "Monto"]],
        body: filas,
      });

      const fechaActual = new Date().toLocaleDateString("en-CA", {
        timeZone: "America/Managua",
      });

      pdf.save(
        `VentasHora_${fechaDesde}_${fechaHasta}_Generado_${fechaActual}.pdf`,
      );
    } catch (error) {
      console.error(error);
      alert("Error generando PDF");
    }
  };

  const generarPdfCategoria = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");

      pdf.setFontSize(18);
      pdf.setTextColor("#330775");
      pdf.setFont("helvetica", "bold");
      pdf.text("Reporte de Ventas por Categoría", 14, 15);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor("#000000");
      pdf.setFontSize(10);
      pdf.text(`Periodo: ${fechaDesde} - ${fechaHasta}`, 14, 22);

      const canvas = await html2canvas(graficoCategoriasRef.current);
      const imagen = canvas.toDataURL("image/png");

      pdf.addImage(imagen, "PNG", 10, 30, 100, 100);

      const filasCategoria = estadisticas.ventasPorCategoria.map((item) => [
        item.name || "General",
        `${item.value}`,
      ]);

      autoTable(pdf, {
        startY: 140,
        head: [["Categoría", "Cantidad"]],
        body: filasCategoria,
      });

      const fechaActual = new Date().toLocaleDateString("en-CA", {
        timeZone: "America/Managua",
      });

      pdf.save(
        `VentasCategoria_${fechaDesde}_${fechaHasta}_Generado_${fechaActual}.pdf`,
      );
    } catch (error) {
      console.error(error);
      alert("Error generando PDF de categorías");
    }
  };

  const generarPdfEstadisticasGenerales = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      let yPosition = 15;

      pdf.setFontSize(18);
      pdf.setTextColor("#330775");
      pdf.setFont("helvetica", "bold");
      pdf.text("Reporte General de Estadísticas", 14, yPosition);

      yPosition += 10;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor("#000000");
      pdf.setFontSize(10);

      pdf.text(`Periodo: ${fechaDesde} - ${fechaHasta}`, 14, yPosition);

      yPosition += 12;

      autoTable(pdf, {
        startY: yPosition,
        head: [["Concepto", "Valor"]],
        body: [
          ["Total Ventas", `C$ ${estadisticas.totalVentas.toFixed(2)}`],
          ["Ventas Efectivo", `C$ ${estadisticas.ventasEfectivo.toFixed(2)}`],
          ["Ventas Tarjeta", `C$ ${estadisticas.ventasTarjeta.toFixed(2)}`],
          ["Productos Vendidos", estadisticas.productosVendidos.toString()],
          ["Cantidad de Ventas", estadisticas.cantidadVentas.toString()],
        ],
      });

      yPosition = pdf.lastAutoTable.finalY + 12;

      if (graficoHoraRef.current) {
        if (yPosition > 200) {
          pdf.addPage();
          yPosition = 15;
        }

        pdf.setFontSize(13);
        pdf.setTextColor("#330775");
        pdf.setFont("helvetica", "bold");

        pdf.text("Gráfico: Ventas por Hora", 14, yPosition);

        yPosition += 8;

        const canvas1 = await html2canvas(graficoHoraRef.current);

        pdf.addImage(
          canvas1.toDataURL("image/png"),
          "PNG",
          10,
          yPosition,
          190,
          70,
        );

        yPosition += 75;
      }

      if (graficoCategoriasRef.current) {
        if (yPosition > 200) {
          pdf.addPage();
          yPosition = 15;
        }

        pdf.setFontSize(13);
        pdf.setTextColor("#330775");
        pdf.setFont("helvetica", "bold");

        pdf.text("Gráfico: Ventas por Categoría", 14, yPosition);

        yPosition += 8;

        const canvas2 = await html2canvas(graficoCategoriasRef.current);

        pdf.addImage(
          canvas2.toDataURL("image/png"),
          "PNG",
          10,
          yPosition,
          100,
          100,
        );
      }

      const fechaActual = new Date().toLocaleDateString("en-CA", {
        timeZone: "America/Managua",
      });

      pdf.save(
        `ReporteGeneral_${fechaDesde}_${fechaHasta}_Generado_${fechaActual}.pdf`,
      );
    } catch (error) {
      console.error(error);
      alert("Error generando PDF general");
    }
  };

  if (cargando) {
    return (
      <div className="vista-contenedor text-center py-5 carga-marca">
        <Spinner animation="border" size="lg" />
        <p className="mt-3">Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <Container fluid className="vista-contenedor px-3 px-md-4">
      <EncabezadoVista
        titulo="Inicio"
        icono="bi bi-speedometer2"
        subtitulo="Estadísticas del negocio"
      />

      <Row className="g-3 align-items-end mb-4 formulario-marca">
        <Col xs={6} md={3}>
          <Form.Group>
            <Form.Label>Desde</Form.Label>

            <Form.Control
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </Form.Group>
        </Col>

        <Col xs={6} md={3}>
          <Form.Group>
            <Form.Label>Hasta</Form.Label>

            <Form.Control
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </Form.Group>
        </Col>

        <Col md={6} className="d-flex align-items-end gap-2 flex-wrap">
          <Button className="btn-marca" onClick={descargarExcel}>
            <i className="bi bi-file-earmark-excel me-2"></i>
            Descargar Excel
          </Button>

          <Button
            className="btn-marca-outline"
            onClick={generarPdfEstadisticasGenerales}
          >
            <i className="bi bi-file-earmark-pdf me-2"></i>
            Reporte General
          </Button>

          <Button className="btn-marca-outline" onClick={generarPdfCategoria}>
            <i className="bi bi-pie-chart me-2"></i>
            Reporte Categoría
          </Button>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col xs={12} md={6} lg={3}>
          <Card className="h-100 text-white vista-tarjeta-estadistica vista-tarjeta--ventas">
            <Card.Body>
              <h5>
                <i className="bi bi-cash-stack me-2"></i>
                Ventas Totales
              </h5>

              <h2>C$ {estadisticas.totalVentas.toFixed(2)}</h2>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={6} lg={3}>
          <Card className="h-100 text-white vista-tarjeta-estadistica vista-tarjeta--ordenes">
            <Card.Body>
              <h5>
                <i className="bi bi-receipt me-2"></i>
                Órdenes
              </h5>

              <h2>{estadisticas.cantidadOrdenes}</h2>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={6} lg={3}>
          <Card className="h-100 text-white vista-tarjeta-estadistica vista-tarjeta--cantidad">
            <Card.Body>
              <h5>
                <i className="bi bi-bag-check me-2"></i>
                Ventas
              </h5>

              <h2>{estadisticas.cantidadVentas}</h2>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={6} lg={3}>
          <Card className="h-100 text-white vista-tarjeta-estadistica vista-tarjeta--productos">
            <Card.Body>
              <h5>
                <i className="bi bi-box-seam me-2"></i>
                Productos vendidos
              </h5>

              <h2>{estadisticas.productosVendidos}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col xs={12} lg={8}>
          <Card className="vista-panel border-0">
            <Card.Body ref={graficoHoraRef}>
              <h5 className="vista-panel-titulo mb-3">
                <i className="bi bi-graph-up" />
                Ventas por Hora
              </h5>

              <div
                style={{
                  position: "relative",
                  height: "300px",
                }}
              >
                <canvas ref={lineChartRef} />
              </div>
            </Card.Body>

            <Card.Footer className="bg-transparent border-0 pt-0">
              <Button className="btn-marca-outline" onClick={generarPdfVentasHora}>
                <i className="bi bi-file-earmark-pdf me-2"></i>
                Descargar PDF
              </Button>
            </Card.Footer>
          </Card>
        </Col>

        <Col xs={12} lg={4}>
          <Card className="vista-panel border-0">
            <Card.Body ref={graficoCategoriasRef}>
              <h5 className="vista-panel-titulo mb-3">
                <i className="bi bi-pie-chart" />
                Ventas por Categoría
              </h5>

              <div
                style={{
                  position: "relative",
                  height: "300px",
                }}
              >
                <canvas ref={pieChartRef} />
                {estadisticas.ventasPorCategoria.length === 0 && (
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center text-muted text-center px-3"
                    style={{ pointerEvents: "none" }}
                  >
                    <div>
                      <i className="bi bi-pie-chart d-block fs-1 mb-2" />
                      No hay ventas por categoría en este periodo
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>

            <Card.Footer className="bg-transparent border-0 pt-0">
              <Button className="btn-marca-outline" onClick={generarPdfCategoria}>
                <i className="bi bi-pie-chart me-2"></i>
                Descargar PDF
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Inicio;
