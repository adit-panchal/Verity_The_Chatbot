import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/login?mode=signup", { replace: true });
  }, [navigate]);

  return null;
};

export default Register;
