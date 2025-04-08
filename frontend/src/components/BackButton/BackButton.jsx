import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react"; 
import React from "react";

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow transition"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );
};

export default BackButton;
