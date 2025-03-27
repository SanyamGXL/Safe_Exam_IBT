"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { FaUserGraduate, FaExclamationTriangle } from "react-icons/fa";

export function NavbarData() {
  const router = useRouter();

  return (
    router.push("/Dashboard")
  );
}

export default NavbarData;
