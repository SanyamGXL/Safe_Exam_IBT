"use client";
import React, { useEffect, useState } from "react";
import { Line, Pie, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  BarController,
  RadarController,
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Card } from "@/components/ui/card";
import { FaRedo } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { fetchData, anomalyUrl,citywiseUrl,centerwiseUrl } from "../FetchUrl/page";

// Register the chart components
ChartJS.register(
  LineElement,
  RadarController,
  BarController,
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  BarElement
);

interface StudentData {
  student_id: string;
  wallet_address: string;
  exam_title: string;
  city: string;
  center_name: string;
  start_time: string;
  booklet: string;
  que_ans: string;
  suspicious_activity_detected: string;
  end_time: string;
  transaction_id: string;
}

interface Filter {
  city: string;
  center: string;
  title: string;
  date: string;
}

interface AnomalyData {
  total_student_count: number;
  total_suspicious_count: number;
}

interface CityAnomalyData {
  city_count: number;
  city_wise_anomaly_count: number;
}

interface CenterAnomalyData {
  center_count: number;
  center_wise_anomaly_count: number;
}

interface Props {
  dataType: string;
}

export function Analytics({ dataType }: Props) {
  const [studentData, setStudentData] = useState<StudentData[]>([]);
  const [anomalyData, setAnomalyData] = useState<AnomalyData>();
  const [cityAnomalyData, setCityAnomalyData] = useState<CityAnomalyData>();
  const [centerAnomalyData, setCenterAnomalyData] = useState<CenterAnomalyData>();
  const [lineChartData, setLineChartData] = useState<any>({
    labels: [],
    datasets: [],
  });
  const [pieChartData, setPieChartData] = useState<any>({
    labels: [],
    datasets: [],
  });
  const [barChartData, setBarChartData] = useState<any>({
    labels: [],
    datasets: [],
  });
  const [doughnutChartData, setDoughnutChartData] = useState<any>({
    labels: [],
    datasets: [],
  });
  const [totalExams, setTotalExams] = useState<number>(0);
  const [anomalyDetectedCount, setAnomalyDetectedCount] = useState<number>(0);
  const [totalCenters, setTotalCenters] = useState<number>(0);
  const [filter, setFilter] = useState<Filter>({
    city: "",
    center: "",
    title: "",
    date: "",
  });
  const [defaultFilter, setDefaultFilter] = useState<Filter>({
    city: "",
    center: "",
    title: "",
    date: "",
  });
  const [uniqueCities, setUniqueCities] = useState<string[]>([]);
  const [uniqueCenters, setUniqueCenters] = useState<string[]>([]);
  const [uniqueTitles, setUniqueTitles] = useState<string[]>([]);
  const [filteredCenters, setFilteredCenters] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(anomalyUrl)
      .then((response) => response.json())
      .then((data: AnomalyData) => {
        setAnomalyData(data);
        console.log(
          "total_student_count:",
          data.total_student_count,
          "total_suspicious_count:",
          data.total_suspicious_count
        );
        const anomalyCount = data.total_suspicious_count;
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
      .catch((error) =>
        console.error("Error fetching suspicious data:", error)
      );
    if (dataType) {
      setLoading(true);
      fetchData(dataType)
        .then((data: StudentData[]) => {
          console.log("Student Data Fetched!", data);

          // Remove duplicates based on wallet_address
          const uniqueStudents = Array.from(
            new Map(data.map((item) => [item.wallet_address, item])).values()
          );
          setStudentData(uniqueStudents);

          const cities = Array.from(
            new Set(
              uniqueStudents.map((student) => student.city).filter(Boolean)
            )
          );
          const centers = Array.from(
            new Set(
              uniqueStudents
                .map((student) => student.center_name)
                .filter(Boolean)
            )
          );
          const titles = Array.from(
            new Set(
              uniqueStudents
                .map((student) => student.exam_title)
                .filter(Boolean)
            )
          );

          // Update unique values
          setUniqueCities(cities);
          setUniqueCenters(centers);
          setUniqueTitles(titles);

          const examsPerCenter = centers.map(
            (center) =>
              uniqueStudents.filter((student) => student.center_name === center)
                .length
          );
          const examsPerCity = cities.map(
            (city) =>
              uniqueStudents.filter((student) => student.city === city).length
          );
          const anomalyCount = uniqueStudents.filter(
            (student) =>
              student.suspicious_activity_detected.toLowerCase() !== "no"
          ).length;
          const completedExams = uniqueStudents.filter(
            (student) => student.end_time
          ).length;

          // Update chart data
          setLineChartData({
            labels: cities,
            datasets: [
              {
                label: "Exams Per City",
                data: examsPerCity,
                borderColor: "#4caf50",
                backgroundColor: "rgba(76, 175, 80, 0.2)",
                tension: 0.1,
              },
            ],
          });

          setPieChartData({
            labels: ["Anomaly Detected", "No Anomaly"],
            datasets: [
              {
                data: [anomalyCount, uniqueStudents.length - anomalyCount],
                backgroundColor: ["#f44336", "#4caf50"],
                hoverBackgroundColor: ["#e57373", "#66bb6a"],
              },
            ],
          });

          setTotalExams(titles.length);
          setAnomalyDetectedCount(anomalyCount);
          setTotalCenters(centers.length);
          setBarChartData({
            labels: centers,
            datasets: [
              {
                label: "Students",
                data: examsPerCenter,
                backgroundColor: "rgba(76, 175, 80, 0.2)",
                borderColor: "#4caf50",
                borderWidth: 1,
              },
            ],
          });

          setDoughnutChartData({
            labels: ["Completed", "Not Completed"],
            datasets: [
              {
                data: [completedExams, uniqueStudents.length - completedExams],
                backgroundColor: ["#4caf50", "#f44336"],
                hoverBackgroundColor: ["#66bb6a", "#e57373"],
              },
            ],
          });
        })
        .catch((error) => {
          console.error("Error While Fetching Data", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [dataType]);

  useEffect(() => {
    fetch(anomalyUrl)
    .then((response) => response.json())
    .then((data: AnomalyData) => {
      setAnomalyData(data);
      console.log(
        "total_student_count:",
        data.total_student_count,
        "total_suspicious_count:",
        data.total_suspicious_count
      );
      const anomalyCount = data.total_suspicious_count;
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
    .catch((error) =>
      console.error("Error fetching suspicious data:", error)
    );
    if (filter.city || filter.center) {
      if (filter.city) {
        console.log("Selected City:",filter.city);
        fetch(`${citywiseUrl}/${filter.city}`)
          .then((response) => response.json())
          .then((data: CityAnomalyData) => {
            setCityAnomalyData(data);
            console.log(
              "city_count:",
              data.city_count,
              "city_wise_anomaly_count:",
              data.city_wise_anomaly_count
            );
            const anomalyCount = data.city_wise_anomaly_count || 0;
            const uniqueStudent = data.city_count || 0;

            const noAnomalyCount = uniqueStudent > 0
          ? uniqueStudent - anomalyCount
          : 0;

          const chartData =
          uniqueStudent > 0
            ? [anomalyCount, noAnomalyCount]
            : [0, 1];

            setAnomalyDetectedCount(anomalyCount);
            setPieChartData({
              labels: ["Anomaly Detected", "No Anomaly"],
              datasets: [
                {
                  data: chartData,
                  backgroundColor: ["#f44336", "#4caf50"],
                  hoverBackgroundColor: ["#e57373", "#66bb6a"],
                },
              ],
            });
          })
          .catch((error) => console.error("Error fetching city data:", error));
      }
  
      if (filter.center) {
        console.log("Selected center:",filter.center);
        fetch(`${centerwiseUrl}/${filter.center}`)
          .then((response) => response.json())
          .then((data: CenterAnomalyData) => {
            setCenterAnomalyData(data);
            console.log(
              "center_count:",
              data.center_count,
              "center_wise_anomaly_count:",
              data.center_wise_anomaly_count
            );

            const anomalyCount = data.center_wise_anomaly_count || 0;
            const uniqueStudent = data.center_count || 0;

            const noAnomalyCount = uniqueStudent > 0
          ? uniqueStudent - anomalyCount
          : 0;

          const chartData =
          uniqueStudent > 0
            ? [anomalyCount, noAnomalyCount]
            : [0, 1];
            setAnomalyDetectedCount(anomalyCount);
            setPieChartData({
              labels: ["Anomaly Detected", "No Anomaly"],
              datasets: [
                {
                  data: chartData,
                  backgroundColor: ["#f44336", "#4caf50"],
                  hoverBackgroundColor: ["#e57373", "#66bb6a"],
                },
              ],
            });
          })
          .catch((error) => console.error("Error fetching center data:", error));
      }
    }

    if (studentData.length > 0) {
      const filteredStudents = studentData
        .filter((student) =>
          filter.city ? student.city === filter.city : true
        )
        .filter((student) =>
          filter.center ? student.center_name === filter.center : true
        )
        .filter((student) =>
          filter.title ? student.exam_title === filter.title : true
        );

      const cities = Array.from(
        new Set(filteredStudents.map((student) => student.city).filter(Boolean))
      );
      const centers = Array.from(
        new Set(
          filteredStudents.map((student) => student.center_name).filter(Boolean)
        )
      );
      const titles = Array.from(
        new Set(
          filteredStudents.map((student) => student.exam_title).filter(Boolean)
        )
      );

      const examsPerCenter = centers.map(
        (center) =>
          filteredStudents.filter((student) => student.center_name === center)
            .length
      );
      const examsPerCity = cities.map(
        (city) =>
          filteredStudents.filter((student) => student.city === city).length
      );

      const completedExams = filteredStudents.filter(
        (student) => student.end_time
      ).length;

      const relatedCenters = uniqueCenters.filter((center) =>
        studentData.some(
          (student) =>
            student.city === filter.city && student.center_name === center
        )
      );
      setFilteredCenters(relatedCenters);

      setLineChartData({
        labels: cities,
        datasets: [
          {
            label: "Exams Per City",
            data: examsPerCity,
            borderColor: "#8e44ad",
            backgroundColor: "rgba(142, 68, 173, 0.2)",
            pointBackgroundColor: "#8e44ad",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#e74c3c",
            pointHoverBorderColor: "#fff",
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.1,
          },
        ],
      });
      
      setBarChartData({
        labels: centers,
        datasets: [
          {
            label: "Students",
            data: examsPerCenter,
            backgroundColor: [
              "rgba(255, 99, 132, 0.2)",
              "rgba(54, 162, 235, 0.2)",
              "rgba(255, 206, 86, 0.2)",
              "rgba(75, 192, 192, 0.2)",
              "rgba(153, 102, 255, 0.2)",
              "rgba(255, 159, 64, 0.2)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
            ],
            borderWidth: 1,
          },
        ],
      });

      setDoughnutChartData({
        labels: ["Completed", "Not Completed"],
        datasets: [
          {
            data: [completedExams, filteredStudents.length - completedExams],
            backgroundColor: [
              "#42a5f5", // Light Blue for "Completed"
              "#ef5350", // Red for "Not Completed"
            ],
            hoverBackgroundColor: [
              "#64b5f6", // Slightly lighter Blue for hover
              "#e57373", // Slightly lighter Red for hover
            ],
          },
        ],
      });
    }
  }, [filter, studentData, uniqueCenters]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  const lineChartOptions = {
    ...chartOptions,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const pieChartOptions = {
    ...chartOptions,
    plugins: {
      tooltip: {
        callbacks: {
          label: (tooltipItem: any) => {
            const { label, raw: value } = tooltipItem;
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

  const barChartOptions = {
    ...chartOptions,
    indexAxis: "y" as const,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  const handleFilterChange =
    (field: keyof Filter) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFilter((prevFilter) => ({
        ...prevFilter,
        [field]: event.target.value,
      }));
      if (field === "city") {
        setFilter((prevFilter) => ({ ...prevFilter, center: "" }));
      }
    };

  const handleResetFilters = () => {
    setFilter(defaultFilter);
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6">SafeExam Analytics</h1>
      {loading ? (
        <div className="w-full flex justify-center items-center h-80">
          <p className="text-lg">Loading...</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-6">
            <select
              className="flex-grow sm:w-1/4 border rounded p-2"
              value={filter.title}
              onChange={handleFilterChange("title")}
            >
              <option value="" hidden>
                Title
              </option>
              {uniqueTitles.map((title, index) => (
                <option key={index} value={title}>
                  {title}
                </option>
              ))}
            </select>
            <select
              className="flex-grow sm:w-1/4 border rounded p-2"
              value={filter.city}
              onChange={handleFilterChange("city")}
            >
              <option value="" hidden>
                City
              </option>
              {uniqueCities.map((city, index) => (
                <option key={index} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <select
              className="flex-grow sm:w-1/4 border rounded p-2"
              value={filter.center}
              onChange={handleFilterChange("center")}
            >
              <option value="" hidden>
                Center
              </option>
              {filteredCenters.map((center, index) => (
                <option key={index} value={center}>
                  {center}
                </option>
              ))}
            </select>
            <button
              className="flex-grow sm:w-1/4 border rounded bg-blue-500 text-white p-2 flex items-center justify-center hover:bg-blue-600 transition"
              onClick={handleResetFilters}
            >
              <FaRedo className="mr-2" /> Reset Filters
            </button>
          </div>
          <div className="flex gap-6 mb-6">
            <Card className="w-full sm:w-2/4 p-4 bg-white shadow-lg rounded-lg">
              <h2 className="text-xl font-semibold mb-4">
                Student Distribution Across Cities
              </h2>
              <div className="h-72">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </Card>
            <Card className="w-full sm:w-2/4 p-4 bg-white shadow-lg rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Anomaly Detection</h2>
              <div className="h-72">
                <Pie data={pieChartData} options={pieChartOptions} />
              </div>
            </Card>
          </div>
          <div className="flex gap-6">
            <Card className="w-full sm:w-2/4 p-4 bg-white shadow-lg rounded-lg">
              <h2 className="text-xl font-semibold mb-4">
                Exam Completion Rate
              </h2>
              <div className="h-72">
                <Doughnut data={doughnutChartData} options={chartOptions} />
              </div>
            </Card>
            <Card className="w-full sm:w-2/4 p-4 bg-white shadow-lg rounded-lg">
              <h2 className="text-xl font-semibold mb-4">
                Student Distribution Across Centers
              </h2>
              <div className="h-72">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;
