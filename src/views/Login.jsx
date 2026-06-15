import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FormularioLogin from "../components/login/FormularioLogin";
import { supabase } from "../database/supabaseconfig";
import "../components/login/login.css";

const Login = () => {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const navegar = useNavigate();

  const iniciarsesion = async (e) => {
    e?.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: usuario,
        password: contrasena,
      });

      if (error) {
        setError("Usuario o contraseña incorrectos");
        return;
      }

      if (data?.session?.user) {
        localStorage.setItem("usuario-supabase", usuario);
      }

      navegar("/");
    } catch (err) {
      setError("Error al conectar con el servidor");
      console.error("Error en la solicitud:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario-supabase");
    if (usuarioGuardado) {
      navegar("/");
    }
  }, [navegar]);

  return (
    <div className="login-pagina">
      <div className="login-fondo" aria-hidden="true">
        <div className="login-circulo login-circulo-1" />
        <div className="login-circulo login-circulo-2" />
      </div>

      <div className="login-contenedor">
        <FormularioLogin
          usuario={usuario}
          contrasena={contrasena}
          error={error}
          cargando={cargando}
          setUsuario={setUsuario}
          setContrasena={setContrasena}
          iniciarSesion={iniciarsesion}
        />
      </div>
    </div>
  );
};

export default Login;
