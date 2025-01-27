"use client";
import React from "react";
import Image from "next/image";
import { useForm, SubmitHandler } from "react-hook-form";
import { TextField, Button, Box, CircularProgress } from "@mui/material";
import { useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { LoginUrl } from "../../apiUrl/page";
import { useRouter } from "next/navigation";
import DialogBox from "@/app/common/DialogBox";
import AlertDialog from "@/app/common/DialogBox";

export interface LoginDetails {
  student_id: string;
  student_password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDetails>();
  const [loginResponse, setLoginResponse] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarStatus, setSnackbarStatus] = useState<"success" | "error">(
    "success"
  );
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const handleCloseSnackbar = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleDialogConfirm = () => {
    setDialogOpen(false);
    try {
      router.push("/QuizPage");
    } catch (error) {
      setErrorMessage("Error navigating to QuizPage:");
    }
  };

  const onSubmit: SubmitHandler<LoginDetails> = async (data) => {
    const { student_id, student_password } = data;
    setLoading(true);
    setLoginResponse(null);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append("student_id", student_id);
      formData.append("student_password", student_password);

      const response = await fetch(LoginUrl, {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
        body: formData,
      });

      if (response.ok) {
        const loginData = await response.json();

        if (loginData.Success) {
          setLoginResponse(`Welcome, ${loginData.student_id || "Student"}!`);
          setSnackbarStatus("success");
          setErrorMessage(null);
          setSnackbarOpen(true);
          setDialogOpen(true);
        } else if (loginData.Error) {
          setErrorMessage(loginData.Error);
          setSnackbarStatus("error");
          setLoginResponse(null);
          setSnackbarOpen(true);
        }
      } else {
        setLoginResponse(null);
        setErrorMessage("Login failed. Please check your credentials.");
        setSnackbarStatus("error");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error during login:", error);
      setLoginResponse(null);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setSnackbarStatus("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="h-screen w-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center"
      style={{ backgroundImage: "url('background/login-bcg.png')" }}
    >
      <div className="h-screen overflow-y-auto ">
        <Image
          height={50}
          width={80}
          src={"/logo/logo.png"}
          style={{ width: "auto", height: "auto" }}
          alt="logo"
        />
        <p className="text-3xl font-bold m-4 text-gray-700"> Welcome,</p>
        <p className="text-3xl font-bold m-4 text-gray-700">
          {" "}
          SafeExam Portal,
        </p>
        <p className=" m-4 w-[50%] h-6 border-solid text-gray-500">
          {" "}
          Login to start your exam with confidence.Your information is handled
          with the utmost care and securely stored to ensure it stays safe and
          protected every step of the way.{" "}
        </p>
        <div className="ml-4 mt-[6%]">
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            className=" p-2 mt-6 rounded-lg shadow-lg flex flex-col w-[45%] text-base"
          >
            <label className="text-gray-700 mb-1">Enter Username</label>
            <TextField
              className="mb-4"
              placeholder="Username"
              variant="outlined"
              size="small"
              fullWidth
              {...register("student_id", { required: "Username is required" })}
              error={!!errors.student_id}
              helperText={errors.student_id?.message}
            />

            <label className="text-gray-700 mb-1">Enter Password</label>
            <TextField
              className="mb-4"
              placeholder="Password"
              variant="outlined"
              type="password"
              size="small"
              fullWidth
              {...register("student_password", {
                required: "Password is required",
              })}
              error={!!errors.student_password}
              helperText={errors.student_password?.message}
            />

            <Button
              className="mb-1"
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : "Login"}
            </Button>
          </Box>
        </div>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbarStatus}
            variant="filled"
          >
            {loginResponse || errorMessage}
          </Alert>
        </Snackbar>

        <AlertDialog
          open={dialogOpen}
          title="Start Exam?"
          content="Are you sure you want to start the exam? Once started, you cannot go back."
          agreeText="Yes, Start"
          disagreeText="Cancel"
          onAgree={handleDialogConfirm}
          onDisagree={handleDialogClose}
          onClose={handleDialogClose}
        />
        
      </div>
    </div>
  );
}
