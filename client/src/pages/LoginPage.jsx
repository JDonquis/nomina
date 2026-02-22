import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";
import { authAPI } from "../services/api";
import labFalconLogo from "../assets/logoBlue.webp";
import background from "../assets/background.webp";
import secretariaLogo from "../assets/secretaria_logo.webp";
import { Icon } from "@iconify/react";
import cintilloCorto from "../assets/cintilloCorto.webp";

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    let emailInput = document.querySelector("#email");
    emailInput?.focus();
  }, 300);
});

export default function LoginPage() {
  const [email, setemail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Add state for showPassword
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login, loading: authLoading } = useAuth();
  const { showError, showSuccess } = useFeedback();
  const [animation, setAnimation] = useState(false);

  const [loadingReset, setLoadingReset] = useState(false);
  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard/nomina", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleForgotPsw = async (e) => {
    setLoadingReset(true)
    if (!email) {
      showError("Por favor ingrese su correo electrónico");
      return;
    }
    try {
      await authAPI.forgotPassword(email);
      showSuccess("Se ha enviado un enlace para restablecer la contraseña");
    } catch (err) {
      showError(err.message);
    } finally {
      setLoadingReset(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAnimation(true);

    try {
      // Use the authAPI.login method instead of fetch
      const data = await authAPI.login({ email, password });

      // Login successful
      if (data) {
        //make animations and then navigate to dashboard

        setTimeout(() => {
          
          login(data, data.token);
          navigate("/dashboard");
        }, 300);
      }
    } catch (err) {
      showError(err.message);
      console.log(err);
      setAnimation(false);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication status
  if (authLoading) {
    return (
      <div className="md:min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <title>Iniciar Sesión - Nómina</title>
      <div className="min-h-screen overflow-hidden relative  bg-color1 bg-cover bg-center">
        <div className={`absolute h-full duration-500 delay-200 z-10 right-0 top-0  ${animation ? "w-full  opacity-100" : "opacity-10  w-1 h-1"} `} style={{background: "#172744"}} ></div>
        <img
          src={background}
          alt="lab"
          className={`absolute   w-full h-full object-cover object-right ${animation ? "zoomAnimationToTheRight " : ""}`}
          aria-hidden="true"
          loading="eager"
        />
        <div
          className={`absolute w-[300px] md:min-w-[400px] md:w-[450px] pb-3 top-24 z-50 md:top-12 lg:top-24 px-5 pt-4 md:pt-10 sm:pt-20 left-1/2 transform -translate-x-1/2 md:left-auto md:transform-none md:right-20 text-white md:p-16 rounded-3xl overflow-hidden ${animation ? "fadeOut" : ""}`}
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(35px)", 
          }}
        >
          {/* <div className="mx-auto bg-color1 fadeInUp-delay-1 fadeInUp   backdrop-blur-none w-16 h-16 md:w-20 md:h-20 flex items-center justify-center aspect-square rounded-full p-2.5 md:p-4">
            <img
              src={labFalconLogo}
              className="logo inline-block mx-auto  "
              alt="logo del sistema"
            />
          </div> */}
          <h1 className="text-white fadeInUp mb-4 fadeInUp-delay-0-5 text-lg md:text-4xl font-bold  mt-4 text-center ">
            Censo de fe de vida
          </h1>
          <p className="fadeInUp fadeInUp-delay-0-5  text-white  text-sm md:text-md text-center">
            Sistema de censo de fe de vida de la Secretaria de Salud del estado Falcón
          </p>



          <form onSubmit={handleSubmit} className={`fadeInUp  font-semibold `} >
            <div className="mb-4 mt-4 md:mt-10 ">
              <label className="block  text-sm  mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setemail(e.target.value)}
                className="w-full bg-white/50  text-gray-800 px-2 py-2 text-sm sm:px-3 sm:py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="relative mb-1 ">
              <label className="block  text-sm  mb-1" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full   bg-white/50  text-gray-800 px-2 py-2 text-sm sm:px-3 sm:py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                required
              />
              {showPassword ? (
                <Icon
                  onClick={() => setShowPassword(!showPassword)}
                  icon="majesticons:eye-line"
                  className=" w-5 h-5  absolute right-3 top-8 font-bold text-gray-900 cursor-pointer"
                />
              ) : (
                <Icon
                  onClick={() => setShowPassword(!showPassword)}
                  icon="mdi:eye-off-outline"
                  className=" w-5 h-5  absolute right-3 top-8 font-bold text-gray-900 cursor-pointer"
                />
              )}
            </div>
            <div className="flex justify-end mb-6">
              {loadingReset ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto"></div>
              ) : 
              <button
                type="button"
                onClick={handleForgotPsw}
                className="text-sm hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
              
              }
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mb-4 md:mb-0 bg-color1 text-color4 font-bold py-2 px-4 rounded  hover:bg-color1 hover:text-color3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opaemailty-50"
            >
              {loading ? "Ingresando..." : "INGRESAR"}
            </button>
          </form>
        </div>
      </div>
      <header className={`flex gap-1 md:gap-4 flex-col md:flex-row items-center px-10 text-color1 text-sm z-40 w-full relative md:absolute  top-0 text-center -100 py-2 lg:py-5 ${animation ? "fadeOut" : ""}`}>
        <img
          src={secretariaLogo}
          alt="secretariaLogo"
          className="w-12 h-12  aspect-square  "
          width={48}
          height={48}
          loading="lazy"
        />
        <img
          src={cintilloCorto}
          alt=""
          className="max-w-[240px] h-min rounded-xl "
          width={240}
          height={48}
          loading="lazy"
        />

      </header>
      <footer className="flex gap-1 flex-col md:flex-row items-center px-10 justify-between text-dark text-sm z-40 w-full relative md:absolute bottom-0 text-center -100 py-1">
        <p className="text-xs">
          &copy; {new Date().getFullYear()} Nomina. Todos los derechos
          reservados.
        </p>
        <a
          href="https://www.linkedin.com/in/juan-franemailsco-villasmil-tovar-50a3a1161/"
          target="_blank"
          rel="noopener noreferrer"
          className=" hover:opaemailty-100 text-xs opaemailty-65 cursor-pointer"
        >
          Desarrollado por Juan Villasmil y Juan Donquis
        </a>
      </footer>
    </>
  );
}
