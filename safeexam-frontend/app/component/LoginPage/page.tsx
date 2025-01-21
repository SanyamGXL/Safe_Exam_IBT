import React from "react";
import LoginProps from "@/app/Login/LoginProps";

export interface LoginDetails {
  username: string;
  password: string;
}

export const LoginPage = async () => {
  try {
    const response = await fetch("", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      let loginData = await response.json();
      console.log("Login successful:", loginData);
      return(
        <div>
          <LoginProps loginData = {loginData}/>
        </div>
      );
      
    } else {
      console.error("Login failed:", response.statusText);
    }
  } catch (error) {
    console.error("Error during login:", error);
  }
  
};