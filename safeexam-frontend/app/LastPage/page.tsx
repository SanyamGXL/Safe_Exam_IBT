"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";

export default function LastPage() {
  const router = useRouter();

  const handleGoHome = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    router.push("/"); 
  };

  return (
    <div
      className="h-screen w-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center"
      style={{ backgroundImage: "url('background/quiz-bcg.png')" }}
    >
      <div className="bg-green-50 bg-opacity-90 p-8 rounded-lg shadow-lg text-center overflow-y-auto">
        <h1 className="text-3xl font-bold mb-4">Thank You for Submitting the Exam!</h1>
        <p className="text-lg mb-6">
          Your responses have been recorded successfully. We will process the results and notify you soon.
        </p>
        <div className="flex justify-center space-x-4">
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleGoHome}
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
