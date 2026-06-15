import React from "react";
import logo from "../../assets/logo.png";

const FormularioLogin = ({
  usuario,
  contrasena,
  error,
  cargando,
  setUsuario,
  setContrasena,
  iniciarSesion,
}) => {
  return (
    <div className="login-tarjeta">
      <div className="login-panel-marca">
        <img src={logo} alt="AlasTapas" className="login-logo" />
        <h1>AlasTapas</h1>
        <p>Gestiona tu negocio de tapas con facilidad y control total.</p>
        <span className="login-badge">
          <i className="bi bi-shield-lock-fill" />
          Acceso seguro
        </span>
      </div>

      <div className="login-panel-formulario">
        <h2>Bienvenido</h2>
        <p className="login-subtitulo">Ingresa tus credenciales para continuar</p>

        {error && (
          <div className="login-alerta" role="alert">
            <i className="bi bi-exclamation-circle-fill" />
            {error}
          </div>
        )}

        <form onSubmit={iniciarSesion}>
          <div className="login-campo">
            <label htmlFor="usuario">Correo electrónico</label>
            <div className="login-input-grupo">
              <span className="login-input-icono">
                <i className="bi bi-envelope-fill" />
              </span>
              <input
                id="usuario"
                type="email"
                placeholder="tu@correo.com"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="login-campo">
            <label htmlFor="contrasena">Contraseña</label>
            <div className="login-input-grupo">
              <span className="login-input-icono">
                <i className="bi bi-lock-fill" />
              </span>
              <input
                id="contrasena"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button type="submit" className="login-boton" disabled={cargando}>
            {cargando ? (
              <>
                <i className="bi bi-arrow-repeat me-2" />
                Ingresando...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2" />
                Iniciar sesión
              </>
            )}
          </button>
        </form>

        <p className="login-pie">Panel de administración · AlasTapas</p>
      </div>
    </div>
  );
};

export default FormularioLogin;
