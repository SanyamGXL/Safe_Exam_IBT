"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaUserGraduate,
  FaBars,
  FaSearch,
  FaSpinner,
  FaHourglassHalf,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import Link from "next/link";
import * as XLSX from "xlsx";
import {fetchData,examMetadataUrl} from "./FetchUrl/page"
import Dashboard from "./Dashboard/page";
import { usePathname } from "next/navigation";
import StudentTable from "./Student/page";
import AnomalyData from "./AnomalyData/page";
import Analytics from "./Analytics/page";
import StudentDataByID from "./StudentById/student/[operation]/[id]/page";

const inter = Inter({ subsets: ["latin"] });
interface StudentData {
  student_id: string;
  wallet_address: string;
  exam_title: string;
  city: string;
  center: string;
  start_time: string;
  booklet: string;
  question_answer: string;
  supicious_activity: string;
  end_time: string;
  transation_id: string;
}

interface ExamData {
  Exam_start_time: string;
  Exam_Title: string;
  Exam_end_time: string;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname(); 
  const router = useRouter();
  const [toggle, setToggle] = useState(true);
  const [filteredData, setFilteredData] = useState<StudentData[]>([]);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [isExamOngoing, setIsExamOngoing] = useState(false);
  const [isExportable, setIsExportable] = useState(false);
  const [dataType, setDataType] = useState("default");

  useEffect(() => {
    fetch(examMetadataUrl, {
      method: "GET",
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((examdata: ExamData) => {
        console.log("Exam Data Fetched!", examdata);
        setExamData(examdata);
      })
      .catch((error) => {
        console.log("Error While Fetching Data", error);
      });
  }, []);

  useEffect(() => {
    async function getFilteredData() {
      try {
        const data = await fetchData(dataType);
        setFilteredData(data);
      } catch (error) {
        console.log("Error fetching filtered data", error);
      }
    }
    if (dataType) {
      getFilteredData();
    }
  }, [dataType]);

  function exportExcel() {
    if (!examData) return;
    // Define column 
    const examDetails = [
      [],
      ["Exam Name",`${examData.Exam_Title}`],
      ["Start Time",`${examData.Exam_start_time}`],
      ["End Time",`${examData.Exam_end_time}`],
      [], // Blank row for separation
    ];
    const headers = [
      [
        "Index No.",
        "Student ID",
        "Wallet Address",
        "Exam Title",
        "City",
        "Center Name",
        "Booklet",
        "Start Time",
        "Que Ans",
        "Suspicious Activity Detected",
        "End Time",
        "Transaction ID",
      ],
    ];

    // Map student data to rows
    const data = filteredData
      .filter((student) => student.exam_title === examData.Exam_Title)
      .map((student, index) =>
        [
          (index + 1).toString(), // Convert number to string
          student.student_id,
          student.wallet_address,
          student.exam_title,
          student.city,
          student.center,
          student.booklet,
          student.start_time,
          student.question_answer,
          student.supicious_activity,
          student.end_time,
          student.transation_id,
        ].map((item) => item.toString())
      );

    // Combine headers and data
    const worksheetData = examDetails.concat(headers, data);

    // Create a new workbook and worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Exam Report");

    // Generate and download the Excel file
    XLSX.writeFile(workbook, `Exam_Report_${examData.Exam_Title}.xlsx`);
  }

  const now = new Date();

  // Utility function to parse the time and combine with today's date
  const parseTime = (timeStr: string) => {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const today = new Date();
    today.setHours(hours, minutes, seconds, 0); // Set hours, minutes, seconds of the current date
    return today;
  };

  useEffect(() => {
    const updateExamStatus = () => {
      if (examData) {
        const now = new Date();
        const examStartTime = parseTime(examData.Exam_start_time);
        const examEndTime = parseTime(examData.Exam_end_time);
  
        setIsExamOngoing(examStartTime <= now && now <= examEndTime);
        setIsExportable(now > examEndTime && now <= new Date(examEndTime.getTime() + 30 * 60000));
      }
    };
  
    updateExamStatus(); 
    const intervalId = setInterval(updateExamStatus, 60000); 
  
    return () => clearInterval(intervalId); 
  }, [examData]);

  return (
    <html lang="en">
      <head>
        {/* You can include metadata components or links to fonts and styles here */}
      </head>
      <body className={`${inter.className} flex bg-gray-100`}>
        {/* Side Navigation */}
        {toggle && (
          <div className="bg-gray-800 w-1/5 flex flex-col items-center">
            <Link
              href="/"
              className="m-4 text-slate-50 flex items-center text-2xl"
            >
              <FaUserGraduate className="mr-2" />
              Dashboard
            </Link>
            <nav className="flex flex-col mt-4 space-y-4">
              <Link
                href="/Student"
                className="text-slate-50 hover:bg-gray-700 p-2 w-full text-center rounded"
              >
                Students Data
              </Link>
              <Link
                href="/AnomalyData"
                className="text-slate-50 hover:bg-gray-700 p-2 w-full text-center rounded"
              >
                Anomaly Detection
              </Link>
              <Link
                href="/Analytics"
                className="text-slate-50 hover:bg-gray-700 p-2 w-full text-center rounded"
              >
                Analytics
              </Link>
            </nav>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              className="p-2 bg-gray-800 rounded"
              onClick={() => setToggle(!toggle)}
            >
              <FaBars className="text-slate-50 text-xl" />
            </button>
            <button
              className={`flex items-center space-x-2 p-3 rounded-lg shadow-md ${
                isExamOngoing
                  ? "bg-gray-500 cursor-not-allowed"
                  : isExportable
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
              onClick={isExamOngoing ? undefined : exportExcel}
              disabled={isExamOngoing || !isExportable}
            >
              {isExamOngoing ? (
                <FaSpinner className="animate-spin text-slate-50" size={20} />
              ) : isExportable ? (
                <FaCheckCircle className="text-slate-50" size={20} />
              ) : (
                <FaExclamationTriangle className="text-gray-600" size={20} />
              )}
              <span className="font-semibold text-slate-50">
                {isExamOngoing
                  ? `${examData?.Exam_Title}`
                  : isExportable
                  ? `${examData?.Exam_Title} - Ended at ${examData?.Exam_end_time}`
                  : "No ongoing or finished exams"}
              </span>
            </button>
          </div>
          <div className="row flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <Input
                type="radio"
                name="dataType"
                value="default"
                checked={dataType === "default"}
                onChange={() => setDataType("default")}
                className="size-4"
              />
              <span>Live Data</span>
            </label>
            <label className="flex items-center space-x-2">
              <Input
                type="radio"
                name="dataType"
                value="dummy"
                checked={dataType === "dummy"}
                onChange={() => setDataType("dummy")}
                className="size-4"
              />
              <span>Dummy Data</span>
            </label>
          </div>
          {pathname === "/" && <Dashboard dataType={dataType} />}
          {pathname === "/Student" && <StudentTable dataType={dataType}  />}
          {pathname === "/AnomalyData" && <AnomalyData dataType={dataType} />}
          {pathname === "/Analytics" && <Analytics dataType={dataType}/>}   
          {pathname.startsWith("/StudentById/student/get/") && <StudentDataByID dataType={dataType}/>} 
         </div>
      </body>
    </html>
  );
}
