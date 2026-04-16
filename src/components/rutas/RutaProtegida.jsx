import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../database/supabaseconfig";

const RutaProtegida = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [estaLogueado, setEstaLogueado] = useState(false);

  useEffect(() => {
    const verificarSesion = async () => {
      const { data } = await supabase.auth.getSession();
      setEstaLogueado(!!data.session);
      setLoading(false);
    };
    verificarSesion();
  }, []);

  if (loading) return null;

  return estaLogueado ? children : <Navigate to="/login" replace />;
};

export default RutaProtegida;