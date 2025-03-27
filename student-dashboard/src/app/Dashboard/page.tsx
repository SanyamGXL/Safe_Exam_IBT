"use client";
import React, { useEffect, useState } from "react";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {fetchData,anomalyUrl} from "../FetchUrl/page";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

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


interface AnomalyData {
  total_student_count: number;
  suspicious_count: number;
}

interface Props {
  dataType: string; 
}

export function Dashboard({ dataType }: Props) {
  const [studentData, setStudentData] = useState<StudentData[]>([]);
  const [anomalyData, setAnomalyData] = useState<AnomalyData>();
  const [lineChartData, setLineChartData] = useState<any>({
    labels: [],
    datasets: [
      {
        label: "Exams Across City",
        data: [],
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
      },
    ],
  });
  const [pieChartData, setPieChartData] = useState<any>({
    labels: ["Anomaly Detected", "No Anomaly"],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ["#f44336", "#4caf50"],
        hoverBackgroundColor: ["#e57373", "#66bb6a"],
      },
    ],
  });
  const [totalExams, setTotalExams] = useState<number>(0);
  const [anomalyDetectedCount, setAnomalyDetectedCount] = useState<number>(0);
  const [totalCenters, setTotalCenters] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(anomalyUrl,{
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    })
      .then((response) => response.json())
      .then((data: AnomalyData) => {
        setAnomalyData(data);
        console.log("total_student_count:",data.total_student_count,"total_suspicious_count:",data.suspicious_count);
        const anomalyCount = data.suspicious_count;
        const uniqueStudent = data.total_student_count;
        setAnomalyDetectedCount(anomalyCount);
        setPieChartData({
          labels: ["Anomaly Detected", "No Anomaly"],
          datasets: [
            {
              data: [anomalyCount, uniqueStudent - anomalyCount],
              backgroundColor: ["#f44336", "#4caf50"],
              hoverBackgroundColor: ["#e57373", "#66bb6a"],
            },
          ],
        });
      })
      .catch((error) => console.error("Error fetching suspicious data:", error));

    if (dataType) {
      setLoading(true);
      fetchData(dataType)  // Fetch data based on the `dataType` query parameter
        .then((data: StudentData[]) => {
          setStudentData(data);
        const uniqueStudents = Array.from(
          new Map(data.map((item) => [item.wallet_address, item])).values()
        );
        setStudentData(uniqueStudents);
        console.log(uniqueStudents);
        const cities = Array.from(
          new Set(uniqueStudents.map((student) => student.city).filter(Boolean))
        );
        const centers = Array.from(
          new Set(
            uniqueStudents.map((student) => student.center).filter(Boolean)
          )
        );
        const titles = Array.from(
          new Set(
            uniqueStudents.map((student) => student.exam_title).filter(Boolean)
          )
        );

        const examsPerCity = cities.map(
          (city) =>
            uniqueStudents.filter((student) => student.city === city).length
        );
        setLineChartData({
          labels: cities,
          datasets: [
            {
              label: "Students",
              data: examsPerCity,
              borderColor: "rgba(75, 192, 192, 1)",
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              tension: 0.1,
            },
          ],
        });

        setTotalExams(titles.length);
        setTotalCenters(centers.length);
      })
      .catch((error) => {
        console.log("Error While Fetching Data", error);
      });
    setLoading(false);
  }}, [dataType]);

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem: any) {
            const label = tooltipItem.label;
            const value = tooltipItem.raw;
            return `${label}: ${value}`;
          },
        },
      },
      legend: {
        display: true,
        position: "bottom" as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50  flex flex-col justify-center sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        {loading ? (
          <div className="w-full flex justify-center items-center h-80">
            <p className="text-lg">Loading...</p>
          </div>
        ) : (
          <>
                <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-3">
                  {/* Dashboard Cards */}
                  <Card className="p-6 bg-white rounded-lg shadow-md flex flex-col justify-between">
                    <h1 className="text-lg font-semibold text-gray-700">
                      Total Exams
                    </h1>
                    <div className="text-3xl font-bold text-gray-900">
                      {totalExams}
                    </div>
                    <Progress
                      value={(totalExams / 100) * 100}
                      className="w-full mt-2"
                    />
                  </Card>

                  <Card className="p-6 bg-white rounded-lg shadow-md flex flex-col justify-between">
                    <h1 className="text-lg font-semibold text-gray-700">
                      Anomaly Detected Students
                    </h1>
                    <div className="text-3xl font-bold text-gray-900">
                      {anomalyDetectedCount}
                    </div>
                    <Progress
                      value={
                        (anomalyDetectedCount /100) * 100
                      }
                      className="w-full mt-2"
                    />
                  </Card>

                  <Card className="p-6 bg-white rounded-lg shadow-md flex flex-col justify-between">
                    <h1 className="text-lg font-semibold text-gray-700">
                      Total Exam Centers
                    </h1>
                    <div className="text-3xl font-bold text-gray-900">
                      {totalCenters}
                    </div>
                    <Progress
                      value={(totalCenters / 100) * 100}
                      className="w-full mt-2"
                    />
                  </Card>
                </div>

                <div className="bg-white shadow-lg rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      Analytics
                    </h2>
                    <Link
                      href="/Analytics"
                      className="text-blue-500 hover:underline"
                    >
                      View All {"->"}
                    </Link>
                  </div>

                  {/* Charts */}
                  <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                    <Card className="p-4 bg-white rounded-lg shadow-md">
                      <h1 className="text-lg font-semibold text-gray-700 mb-4">
                        Student Distribution Across Cities
                      </h1>
                      <div className="h-72">
                        <Line data={lineChartData} options={lineChartOptions} />
                      </div>
                    </Card>

                    <Card className="p-4 bg-white rounded-lg shadow-md">
                      <h1 className="text-lg font-semibold text-gray-700 mb-4">
                        Anomaly Detection
                      </h1>
                      <div className="h-72">
                        <Pie data={pieChartData} options={pieChartOptions} />
                      </div>
                    </Card>
                  </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
