"use client";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { FaFileExcel, FaFilePdf, FaRedo } from "react-icons/fa";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { title } from "process";
import {fetchData} from "../FetchUrl/page"

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

interface Filter {
  city: string;
  center: string;
  title: string;
  date: string;
}

interface Props {
  dataType: string; 
}
export function StudentTable({ dataType }: Props) {
  const router = useRouter();
  const [studentData, setStudentData] = useState<StudentData[]>([]);
  const [filteredData, setFilteredData] = useState<StudentData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [cityFilter, setCityFilter] = useState<string>("");
  const [centerFilter, setCenterFilter] = useState<string>("");
  const [titleFilter, setTitleFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [filteredCenters, setFilteredCenters] = useState<string[]>([]);
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
  const [loading, setLoading] = useState<boolean>(true);

  const recordsPerPage = 5;

  // Fetching the data and setting both studentData and filteredData
  useEffect(() => {
    if (dataType) {
      setLoading(true);
      fetchData(dataType)
      .then((data: StudentData[]) => {
        console.log("Student Data Fetched!", data);
        setStudentData(data);
        setFilteredData(data);
        const cities = Array.from(
          new Set(data.map((student) => student.city).filter(Boolean))
        );
        const centers = Array.from(
          new Set(data.map((student) => student.center).filter(Boolean))
        );
        const titles = Array.from(
          new Set(data.map((student) => student.exam_title).filter(Boolean))
        );

        setUniqueCities(cities);
        setUniqueCenters(centers);
        setUniqueTitles(titles);
      })
      .catch((error) => {
        console.log("Error While Fetching Data", error);
      })
      setLoading(false)
  }}, [dataType]);

  useEffect(() => {
    if (cityFilter) {
      const centersForCity = uniqueCenters.filter((center) =>
        studentData.some(
          (student) =>
            student.city === cityFilter && student.center === center
        )
      );
      setFilteredCenters(centersForCity);
    } else {
      setFilteredCenters(uniqueCenters);
    }
  }, [cityFilter, studentData, uniqueCenters]);

  function parseCustomDate(dateString: string): Date | null {
    const parts = dateString.split("-");
    if (parts.length !== 6) return null;
  
    const [year, month, day, hours, minutes, seconds] = parts.map(Number);
  
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      return null; // Return null if any part is invalid
    }
  
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  useEffect(() => {
    const filtered = studentData.filter((student) => {
      
      if (dateFilter) {
        const studentDate = parseCustomDate(student.start_time);
        if (!studentDate) return false; 
  
        const formattedStudentDate = `${String(studentDate.getDate()).padStart(2, "0")}-${String(
          studentDate.getMonth() + 1
        ).padStart(2, "0")}-${studentDate.getFullYear()}`;
        
        const formattedDate = `${String(dateFilter.getDate()).padStart(2, "0")}-${String(
          dateFilter.getMonth() + 1
        ).padStart(2, "0")}-${dateFilter.getFullYear()}`;
  
        if (formattedStudentDate !== formattedDate) return false;
      }
  
      // Other filters
      return (
        (cityFilter
          ? student.city.toLowerCase().includes(cityFilter.toLowerCase())
          : true) &&
        (centerFilter
          ? student.center.toLowerCase().includes(centerFilter.toLowerCase())
          : true) &&
        (titleFilter
          ? student.exam_title.toLowerCase().includes(titleFilter.toLowerCase())
          : true)
      );
    });
  
    setFilteredData(filtered);
  }, [cityFilter, centerFilter, titleFilter, dateFilter, studentData]);

  const handleStringFilterChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setter(event.target.value);
    };

  const handleDateFilterChange =
    (setter: React.Dispatch<React.SetStateAction<Date | null>>) =>
    (date: Date | null) => {
      setter(date);
    };

  const handleFilterChange =
    (
      type: "string" | "date",
      setter: React.Dispatch<React.SetStateAction<string | Date | null>>
    ) =>
    (event: React.ChangeEvent<HTMLSelectElement> | Date | null) => {
      if (type === "string" && event instanceof Event) {
        setter((event.target as HTMLSelectElement).value);
      } else if (type === "date") {
        setter(event as Date | null);
      }
    };

  // Filter the data based on the search term
  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredArray = studentData.filter((student) =>
      student.wallet_address?.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredData(filteredArray.reverse());
    setCurrentPage(1); // Reset to the first page whenever filtering occurs
  }, [searchTerm, studentData]);

  // Calculate the displayed records based on pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredData.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );

  const totalPages = Math.ceil(filteredData.length / recordsPerPage);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value); // Update the search term on input change
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleResetFilters = () => {
    setFilter(defaultFilter);
    setCityFilter("");
    setCenterFilter("");
    setTitleFilter("");
    setDateFilter(null);
    setFilteredData(studentData);
    setCurrentPage(1);
  };

  function exportExcel() {
    // Define column headers
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
    const data = filteredData.map((student, index) =>
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
    const worksheetData = headers.concat(data);

    // Create a new workbook and worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Data");

    // Generate and download the Excel file
    XLSX.writeFile(workbook, "studentData.xlsx");
  }

  function exportPDF() {
    const unit = "pt";
    const size = "A2"; // Use A1, A2, A3 or A4
    const orientation = "landscape"; // portrait or landscape

    const marginLeft = 40;
    const doc = new jsPDF(orientation, unit, size);

    doc.setFontSize(15);

    const title = "Student Data";
    const headers = [
      [
        "Index No.",
        "Student ID",
        "Wallet Address",
        "Exam Title",
        "City",
        "Center",
        "Booklet",
        "Start Time",
        "Que Ans",
        "Suspicious Activity",
        "End Time",
        "Transaction ID",
      ],
    ];

    const data = filteredData.map((student, index) => [
      index + 1,
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
    ]);

    doc.text(title, marginLeft, 40);
    autoTable(doc, {
      startY: 70,
      head: headers,
      body: data,
      headStyles: { fillColor: [31, 41, 55] },
    });
    doc.save("studentData.pdf");
  }
  return (
    <div className="flex flex-col bg-gray-50 min-h-screen p-6">
    <div className="max-w-screen-lg mx-auto w-full">
      <h1 className="text-xl font-bold mb-6">Student Data</h1>
      {loading ? (
        <div className="w-full flex justify-center items-center h-80">
          <p className="text-lg">Loading...</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <select className="flex-grow sm:w-1/4 border rounded p-2" value={titleFilter} onChange={handleStringFilterChange(setTitleFilter)}>
              <option value="" hidden>Title</option>
              {uniqueTitles.map((title, index) => (
                <option key={index} value={title}>{title}</option>
              ))}
            </select>
            <DatePicker
              className="w-full border rounded p-2"
              selected={dateFilter}
              onChange={handleDateFilterChange(setDateFilter)}
              dateFormat="dd-MM-yyyy"
              placeholderText="DD-MM-YYYY"
              showIcon 
            />
            <select className="flex-grow sm:w-1/4 border rounded p-2" value={cityFilter} onChange={handleStringFilterChange(setCityFilter)}>
              <option value="" hidden>City</option>
              {uniqueCities.map((city, index) => (
                <option key={index} value={city}>{city}</option>
              ))}
            </select>
            <select className="flex-grow sm:w-1/4 border rounded p-2" value={centerFilter} onChange={handleStringFilterChange(setCenterFilter)}>
              <option value="" hidden>Center</option>
              {filteredCenters.map((center, index) => (
                <option key={index} value={center}>{center}</option>
              ))}
            </select>
            <button 
              className="flex-grow sm:w-1/4 border rounded bg-blue-500 text-white p-2 flex items-center justify-center hover:bg-blue-600 transition"
              onClick={handleResetFilters}
            >
              <FaRedo className="mr-2" /> Reset Filters
            </button>
          </div>
          <div className="flex flex-col gap-6 mb-6">
            <Card className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex justify-end gap-2 mb-4">
                <div className="relative">
                  <Button
                    onClick={exportPDF}
                    disabled={currentRecords.length === 0}
                    className="bg-green-600 hover:bg-green-800 my-2 relative group"
                  >
                    <FaFilePdf />
                    {/* Tooltip */}
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block px-2 py-1 text-white text-xs bg-black rounded">
                      Download in PDF
                    </span>
                  </Button>
                </div>
                <div className="relative">
                  <Button
                    onClick={exportExcel}
                    disabled={currentRecords.length === 0}
                    className="bg-blue-600 hover:bg-blue-800 my-2 relative group"
                  >
                    <FaFileExcel />
                    {/* Tooltip */}
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block px-2 py-1 text-white text-xs bg-black rounded">
                      Download in Excel
                    </span>
                  </Button>
                </div>
              </div>
  
              <Table className="min-w-full divide-y divide-gray-200">
                <TableHeader className="bg-gray-200">
                  <TableRow className="whitespace-nowrap">
                    <TableHead className="p-2 text-left">Index No.</TableHead>
                    <TableHead className="p-2 text-left">Student Id</TableHead>
                    <TableHead className="p-2 text-left">Wallet Address</TableHead>
                    <TableHead className="p-2 text-left">Exam Title</TableHead>
                    <TableHead className="p-2 text-left">City</TableHead>
                    <TableHead className="p-2 text-left">Center</TableHead>
                    <TableHead className="p-2 text-left">Start Time</TableHead>
                    <TableHead className="p-2 text-left">Booklet</TableHead>
                    <TableHead className="p-2 text-left">Que Ans</TableHead>
                    <TableHead className="p-2 text-left">Suspicious Activity Detected</TableHead>
                    <TableHead className="p-2 text-left">End Time</TableHead>
                    <TableHead className="p-2 text-left">Transaction Id</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRecords.length > 0 ? (
                    currentRecords?.map((student, index) => (
                      <TableRow key={index}>
                        <TableCell>{indexOfFirstRecord + index + 1}</TableCell>
                        <TableCell>{student.student_id}</TableCell>
                        <TableCell>{student.wallet_address}</TableCell>
                        <TableCell>{student.exam_title}</TableCell>
                        <TableCell>{student.city}</TableCell>
                        <TableCell>{student.center}</TableCell>
                        <TableCell>{student.start_time}</TableCell>
                        <TableCell>{student.booklet}</TableCell>
                        <TableCell>{student.question_answer}</TableCell>
                        <TableCell>{student.supicious_activity}</TableCell>
                        <TableCell>{student.end_time}</TableCell>
                        <TableCell>{student.transation_id}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center">
                        No Data Available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
  
              <div className="flex justify-between my-6">
                <Button onClick={handlePreviousPage} disabled={currentPage === 1}>
                  {"<- "}Previous
                </Button>
                <Button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next{" ->"}
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  </div>
  
  );
}

export default StudentTable;
