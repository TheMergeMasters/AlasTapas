import { Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Pagina404 = () => {
  const navigate = useNavigate();

  return (
    <Container fluid className="vista-contenedor px-3 px-md-4">
      <div className="vista-panel pagina-error">
        <i className="bi bi-exclamation-triangle pagina-error-icono" aria-hidden="true" />
        <h2>Página no encontrada</h2>
        <p>La ruta que buscas no existe o fue movida.</p>
        <Button className="btn-marca" onClick={() => navigate("/")}>
          <i className="bi bi-house-fill me-2" />
          Volver al inicio
        </Button>
      </div>
    </Container>
  );
};

export default Pagina404;
