import { Container, Card } from "react-bootstrap";
import EncabezadoVista from "../components/layout/EncabezadoVista";

const Dashboard = () => {
  return (
    <Container fluid className="vista-contenedor px-3 px-md-4">
      <EncabezadoVista
        titulo="Dashboard"
        icono="bi bi-bar-chart-line-fill"
        subtitulo="Panel de estadísticas en tiempo real"
      />

      <Card className="vista-dashboard" style={{ height: 600 }}>
        <iframe
          title="estadísticas"
          width="100%"
          height="100%"
          src="https://app.powerbi.com/view?r=eyJrIjoiMjNjNmVmODYtYTk2My00ZTZhLTk2YmEtYjI3ZTBiMTlkY2RmIiwidCI6ImU0NzY0NmZlLWRhMjctNDUxOC04NDM2LTVmOGIxNThiYTEyNyIsImMiOjR9"
          allowFullScreen
        />
      </Card>
    </Container>
  );
};

export default Dashboard;
