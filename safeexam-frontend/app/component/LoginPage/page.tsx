"use client";
import React from "react";
import Image from "next/image";
import { useForm, SubmitHandler } from "react-hook-form";
import { TextField, Button, Box, CircularProgress } from "@mui/material";
import { useState } from "react";
import { API_URLS } from "../../apiUrl/apiUrl";
import { useRouter } from "next/navigation";
import CustomSnackbar from "@/app/common/SnackBar";
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
  const [loginResponse, setLoginResponse] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarStatus, setSnackbarStatus] = useState<
    "success" | "error" | "warning"
  >("success");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [warningDialogOpen, setWarningDialogOpen] = useState<boolean>(false);
  const [maxQuestionNumber, setMaxQuestionNumber] = useState<number>(0);

  const handleCloseSnackbar = () => setSnackbarOpen(false);

  const handleDialogClose = () => {
    setDialogOpen(false);
    setWarningDialogOpen(false);
  };

  const handleDialogConfirm = () => {
    setDialogOpen(false);
    setWarningDialogOpen(false);
    try {
      router.push("/QuizPage");
    } catch (error) {
      setErrorMessage("Error navigating to QuizPage:");
      console.error(error);
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
      const response = await fetch(API_URLS.LoginUrl, {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
        body: formData,
      });
      console.log("Login Response:", response);
      const loginData = await response.json();
      if (response.ok) {
        const start_time = Math.floor(Date.now() / 1000);
        localStorage.setItem("student_id", student_id);
        localStorage.setItem("start_time", start_time.toString());
        console.log("Student_id:", student_id, "Start_time:", start_time);
        console.log("Login Response:", loginData);
        if (loginData) {
          console.log("Success");
          setLoginResponse(`Welcome, ${student_id || "Student"}!`);
          setSnackbarStatus("success");
          setErrorMessage(null);
          setSnackbarOpen(true);
          setDialogOpen(true);
          setMaxQuestionNumber(loginData.max_question_number);
          if (
            loginData.max_question_number > 0 &&
            loginData.question_answer_data
          ) {
            localStorage.setItem(
              "max_question_number",
              loginData.max_question_number
            );
            localStorage.setItem(
              "question_answer_data",
              JSON.stringify(loginData.question_answer_data)
            );
            setDialogOpen(true);
          } else {
            setDialogOpen(true);
          }
        }
      } else if (loginData.Error) {
        setErrorMessage(loginData.Error);
        console.log(loginData.Error);
        if (loginData.Error == "IP not registered."){
          console.log("Hello inside if!");
          window.open(`${API_URLS.SendRegistrationJson}/${student_id}`, "_blank");
          window.open(`${API_URLS.SetupEXE}/${student_id}`, "_blank");
          setWarningDialogOpen(true)
          console.log(`Download triggered: ${API_URLS.SendRegistrationJson}/${student_id}`);
          console.log(`Download triggered: ${API_URLS.SetupEXE}/${student_id}`);
        }
        setSnackbarStatus("error");
        setLoginResponse(null);
        setSnackbarOpen(true);
      } else if (loginData.Status) {
        setErrorMessage(loginData.Status);
        setSnackbarStatus("warning");
        setLoginResponse(null);
        setSnackbarOpen(true);
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
        <div className="ml-6 mt-[4%]">
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            className="p-4 mt-4 rounded-lg shadow-lg flex flex-col w-[45%] text-base"
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

        <CustomSnackbar
          open={snackbarOpen}
          onClose={handleCloseSnackbar}
          message={loginResponse || errorMessage || ""}
          severity={snackbarStatus}
        />

        <AlertDialog
          open={dialogOpen}
          title={loginResponse || "Start Exam?"}
          content={
            maxQuestionNumber == 1
              ? "Are you sure you want to start the exam? Once started, you cannot go back."
              : "You have a resume exam. Do you want to continue?"
          }
          agreeText="Yes, Start"
          disagreeText="Cancel"
          onAgree={handleDialogConfirm}
          onDisagree={handleDialogClose}
          onClose={handleDialogClose}
        />
        <AlertDialog 
          open={warningDialogOpen}
          title="⚠ Warning: Unregistered IP Address"
          content="Your IP address is not registered in our system. Please enable pop-ups to allow the automatic download of the required JSON and EXE files. Once the EXE file is downloaded, run it to complete the device registration process. Thank you."
          agreeText="Understood"
          disagreeText=""
          onAgree={handleDialogClose}
          onDisagree={handleDialogClose}
          onClose={handleDialogClose}
        />
      </div>
    </div>
  );
}
