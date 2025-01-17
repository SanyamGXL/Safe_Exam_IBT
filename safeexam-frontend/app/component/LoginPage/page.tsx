"use client";
import Image from "next/image";
import { useForm, SubmitHandler } from "react-hook-form";
import { TextField, Button, Box } from "@mui/material";
interface LoginDetails {
  username: string;
  password: string;
}
export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDetails>();

  const onSubmit: SubmitHandler<LoginDetails> = (data) => console.log(data);

  return (
        <div className="h-screen overflow-y-auto ">
      <Image height={50} width={80} src={"/logo/logo.png"} alt="logo" />
      <p className="text-3xl font-bold m-4 text-gray-700"> Welcome,</p>
      <p className="text-3xl font-bold m-4 text-gray-700"> SafeExam Portal,</p>
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
            {...register("username", { required: "Username is required" })}
            error={!!errors.username}
            helperText={errors.username?.message}
          />

          <label className="text-gray-700 mb-1">Enter Password</label>
          <TextField
          className="mb-4"
            placeholder="Password"
            variant="outlined"
            type="password"
            size="small"
            fullWidth
            {...register("password", { required: "Password is required" })}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <Button className="mb-1" type="submit" variant="contained" color="primary"  fullWidth>
            Login
          </Button>
        </Box>
      </div>
      </div>
  );
}
