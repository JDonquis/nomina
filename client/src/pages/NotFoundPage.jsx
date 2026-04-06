import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <Icon 
          icon="mdi:alert-circle-outline" 
          className="text-8xl text-gray-400 mx-auto mb-4"
        />
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-600 mb-4">
          Página no encontrada
        </h2>
        <p className="text-gray-500 mb-8">
          La página que buscas no existe o ha sido movida.
        </p>
        <Link
          to="/dashboard/personal_activo"
          className="inline-flex items-center gap-2 px-6 py-3 bg-color1 text-white rounded-lg hover:brightness-110 transition-all"
        >
          <Icon icon="mdi:home" />
          Ir a Personal Activo
        </Link>
      </div>
    </div>
  );
}