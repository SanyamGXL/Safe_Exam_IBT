"use client";
import { CircularProgress, Button } from "@mui/material";
import React, { useCallback, useEffect, useRef } from "react";
import { useState } from "react";
import AlertDialog from "../common/DialogBox";
import { API_URLS } from "../apiUrl/apiUrl";
import CustomSnackbar from "../common/SnackBar";
import { useRouter } from "next/navigation";
import { enterFullScreen, ensureFullScreen } from "@/app/common/fullScreen";

interface ExamData {
  Exam_Title: string;
  City: string;
  Center: string;
  Booklet: string;
  question_paper: {
    que: string;
    options: string[];
  }[];
}

interface BlockchainData {
  student_id: string;
  start_time: string;
  que_ans: string;
  exam_title: string;
  city: string;
  center_name: string;
  booklet: string;
  suspicious_activity_detected: string;
  end_time: string;
}

export default function QuizPage() {
  const [queno, setQueno] = useState(0);
  const [examdata, setExamData] = useState<ExamData | null>(null);
  const [questions, setQuestions] = useState<
    { que: string; options: string[] }[]
  >([]);
  const [blockchainData, setBlockchainData] = useState<BlockchainData[]>([]);
  const [interactedQuestions, setInteractedQuestions] = useState<Set<number>>(
    new Set([0])
  );
  const [dialogMode, setDialogMode] = useState<"warning" | "confirmation">(
    "warning"
  );
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarStatus, setSnackbarStatus] = useState<"success" | "error">(
    "success"
  );
  const [timeLeft, setTimeLeft] = useState(120);
  const [previousAnswers, setPreviousAnswers] = useState<string[]>([]);
  const [switchTabDialogOpen, setSwitchTabDialogOpen] = useState(false);
  const router = useRouter();
  const handleCloseSnackbar = () => setSnackbarOpen(false);
  const [tabSwitchAnomalies, setTabSwitchAnomalies] = useState<
    BlockchainData[]
  >([]);
  const [fullscreenDialogOpen, setFullscreenDialogOpen] =
    useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleFullscreenConfirm = () => {
    enterFullScreen();
    ensureFullScreen();
    setFullscreenDialogOpen(false);
  };

 const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const storedTimeLeft = localStorage.getItem("remaining_time");
    const startTime = Date.now();
    const remainingTime = storedTimeLeft ? parseInt(storedTimeLeft, 10) : 120;

    timerRef.current = setInterval(() => {
      const currentTime = Date.now();
      const elapsedTime = Math.floor((currentTime - startTime) / 1000);
      const newremainingTime = remainingTime - elapsedTime;

      if (newremainingTime <= 0) {
        clearInterval(timerRef.current!);
        setTimeLeft(0);
        localStorage.removeItem("remaining_time");
        router.push("/LastPage");
      } else {
        setTimeLeft(newremainingTime);
        localStorage.setItem("remaining_time", newremainingTime.toString());
      }
    }, 1000);
  }, [router]);

  useEffect(() => {
    const handleUnload = () => {
      localStorage.setItem("remaining_time", timeLeft.toString());
    };
  
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [timeLeft]);

  const loadQuestions = useCallback(async () => {
    try {
      const response = await fetch(API_URLS.ExamMetadata, {
        method: "GET",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      });
      if (!response.ok) {
        setErrorMessage("Failed to fetch question data");
        setSnackbarStatus("error");
        setSnackbarOpen(true);
        return;
      }
      const data = await response.json();
      if (
        !data ||
        !Array.isArray(data.question_paper) ||
        data.question_paper.length === 0
      ) {
        throw new Error("Invalid question format or empty response.");
      }
      setExamData({
        Exam_Title: data.Exam_Title,
        City: data.City,
        Center: data.Center,
        Booklet: data.Booklet,
        question_paper: data.question_paper,
      });
      setQuestions(data.question_paper);
      startTimer();
      setPreviousAnswers(Array(data.question_paper.length).fill("-"));
      const maxQueNo = localStorage.getItem("max_question_number");
      const queAnsData = localStorage.getItem("question_answer_data");

      console.log("Resume:", maxQueNo, queAnsData);

      const initialAnswers = Array(data.question_paper.length).fill(-1);
      let lastQuestionIndex = 0;

      if (maxQueNo && queAnsData) {
        try {
          const parsedMaxQueNo = parseInt(maxQueNo, 10);
          const parsedQueAnsData = JSON.parse(queAnsData);
          const prevAnswers = Array(data.question_paper.length).fill("-");
          Object.entries(parsedQueAnsData).forEach(
            ([questionNumber, answer]) => {
              const index = parseInt(questionNumber) - 1;
              const answerIndex = ["A", "B", "C", "D"].indexOf(
                (answer as string).toUpperCase()
              );
              if (
                index >= 0 &&
                index < initialAnswers.length &&
                answerIndex !== -1
              ) {
                prevAnswers[index] = answer;
                initialAnswers[index] = answerIndex;
              }
              setPreviousAnswers(prevAnswers);
              lastQuestionIndex = parsedMaxQueNo - 1;
              lastQuestionIndex = Math.min(
                lastQuestionIndex,
                data.question_paper.length - 1
              );
              const newInteracted = new Set(
                Array.from({ length: parsedMaxQueNo }, (_, i) => i)
              );
              setInteractedQuestions(newInteracted);
            }
          );
        } catch (error) {
          console.error("Error parsing resume data:", error);
        }
      }
      setSelectedAnswers(initialAnswers);
      setQueno(lastQuestionIndex);
    } catch (error) {
      setErrorMessage(`Error fetching questions: ${error}`);
      setSnackbarStatus("error");
      setSnackbarOpen(true);
    }
  }, [startTimer]);

  const WriteToBlockchain = useCallback(async (
    questionIndex: number,
    isFinalSubmit = false,
    anomaly?: BlockchainData
  ) => {
    if (!questions.length) {
      setErrorMessage("Exam data not loaded.");
      setSnackbarStatus("error");
      setSnackbarOpen(true);
      return;
    }
    const currentExam = examdata;
    const answerLetter = String.fromCharCode(
      65 + selectedAnswers[questionIndex]
    );
    if (previousAnswers[questionIndex] === answerLetter && !isFinalSubmit) {
      console.log(
        `Skipping write for question ${questionIndex + 1}, answer unchanged.`
      );
      return;
    }
    const blockchainPayload: BlockchainData = anomaly || {
      student_id: localStorage.getItem("student_id") || "-",
      start_time: localStorage.getItem("start_time") || "-",
      que_ans: `${questionIndex + 1}-${answerLetter}`,
      exam_title: currentExam?.Exam_Title || "-",
      city: currentExam?.City || "-",
      center_name: currentExam?.Center || "-",
      booklet: currentExam?.Booklet || "-",
      suspicious_activity_detected: "-",
      end_time: isFinalSubmit ? Math.floor(Date.now() / 1000).toString() : "-",
    };
    console.log("blockchainPayload", blockchainPayload);
    console.log(blockchainData);
    try {
      const response = await fetch(API_URLS.WriteBlockchain, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(blockchainPayload),
      });

      if (!response.ok) {
        throw new Error("Failed to write exam data to blockchain.");
      }

      const data: BlockchainData[] = await response.json();
      setBlockchainData(data);
      setSnackbarStatus("success");
      setSnackbarOpen(true);
      setPreviousAnswers((prev) => {
        const updated = [...prev];
        updated[questionIndex] = answerLetter;
        return updated;
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(`Blockchain write error: ${error.message}`);
        setSnackbarStatus("error");
        setSnackbarOpen(true);
      } else {
        setErrorMessage(`Blockchain write error: Unknown error occurred.`);
      }
    }
  },
  [questions, examdata, selectedAnswers, previousAnswers,blockchainData]
);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && examdata) {
        const anomaly: BlockchainData = {
          student_id: localStorage.getItem("student_id") || "-",
          start_time: "-",
          que_ans: "-",
          exam_title: examdata?.Exam_Title || "-",
          city: examdata?.City || "-",
          center_name: examdata?.Center || "-",
          booklet: examdata?.Booklet || "-",
          suspicious_activity_detected: `Tab switched on ${new Date().toLocaleString()}`,
          end_time: "-",
        };

        setTabSwitchAnomalies((prevAnomalies) => {
          const updatedAnomalies = [...prevAnomalies, anomaly];
          console.log(
            "Tab Switch Anomalies:",
            JSON.stringify(updatedAnomalies, null, 2)
          );
          return updatedAnomalies;
        });
        setSwitchTabDialogOpen(true);
        WriteToBlockchain(queno, false, anomaly);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [tabSwitchAnomalies, examdata,queno,WriteToBlockchain]);


  const next_page = async () => {
    if (selectedAnswers[queno] === -1) {
      setDialogMode("warning");
      setDialogOpen(true);
      return;
    }
    await WriteToBlockchain(queno);
    if (queno < questions.length - 1) {
      setQueno(queno + 1);
      setInteractedQuestions((prev) => new Set(prev).add(queno + 1));
    }
  };

  const previous_page = () => {
    if (queno > 0) {
      setQueno(queno - 1);
      setInteractedQuestions((prev) => new Set(prev).add(queno - 1));
    }
  };

  const handleQuestionClick = (event: React.MouseEvent<HTMLLIElement>) => {
    setQueno(parseInt(event.currentTarget.getAttribute("data-index") || "0"));
  };

  const handleSelectedAnswer = (index: number) => {
    const updatedAnswers = [...selectedAnswers];
    updatedAnswers[queno] = index;
    setSelectedAnswers(updatedAnswers);
  };

  const handleTabSwitchClose = () => {
    setSwitchTabDialogOpen(false);
  };

  const handleContinueExam = () => {
    setSwitchTabDialogOpen(false);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleSubmitExam = () => {
    if (selectedAnswers[queno] === -1) {
      setDialogMode("warning");
      setDialogOpen(true);
      return;
    }
    setDialogMode("confirmation");
    setDialogOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setDialogOpen(true);
    await WriteToBlockchain(queno, true);
    localStorage.removeItem("student_id");
    localStorage.removeItem("start_time");
    router.push("/LastPage");
  };

  useEffect(() => {
    setFullscreenDialogOpen(true);
    const initializeQuiz = async () => {
      const storedTimeLeft = localStorage.getItem("remaining_time");
      if (storedTimeLeft) {
        setTimeLeft(parseInt(storedTimeLeft, 10));
      }
      await loadQuestions();
    };
    initializeQuiz();
  }, [loadQuestions]);

  useEffect(() => {
    if (timeLeft === 0) {
      router.push("/LastPage");
    }
  }, [timeLeft, router]);

  const currentQuestion = questions[queno];
  const progressPercentage = (timeLeft / 120) * 100;
  const progressColor = timeLeft <= 30 ? "error" : "success";

  return (
    <div
      className="h-screen w-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center"
      style={{ backgroundImage: "url('background/quiz-bcg.png')" }}
    >
      <div className="flex flex-row h-full w-full overflow-y-auto">
        <div className="m-4 w-[80%] h-[95%]">
          <p className="text-2xl font-bold p-4 sticky top-0">
            Bank Exam Questions
          </p>
          <div className="p-4 h-[calc(90%-56px)] overflow-y-auto rounded-lg">
            <p className="text-xl underline font-semibold mb-2">
              Question: {queno + 1}
            </p>
            <p className="mb-6 text-xl">{currentQuestion?.que}</p>
            <div className="space-y-4">
              {currentQuestion?.options?.map((option, index) => (
                <button
                  key={index}
                  className={`w-full text-left p-4 border rounded-md flex items-center hover:bg-green-100 ${
                    selectedAnswers[queno] === index ? "bg-green-200" : ""
                  }`}
                  onClick={() => handleSelectedAnswer(index)}
                >
                  <span className="font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="ml-4">{option}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="sticky flex justify-evenly">
            <Button
              variant="contained"
              size="large"
              onClick={previous_page}
              disabled={queno === 0}
            >
              Previous
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={
                queno === questions.length - 1 ? handleSubmitExam : next_page
              }
              color={queno === questions.length - 1 ? "success" : "primary"}
            >
              {queno === questions.length - 1 ? "Submit Exam" : "Next"}
            </Button>
          </div>
        </div>

        <div className="m-4 w-[20%] h-[95%] shadow-2xl rounded-lg">
          <div className="m-4 bg-green-100 p-4 rounded-md text-center mb-6">
            <p className="text-sm text-gray-500">Timer Remaining:</p>
            <p
              className={`text-2xl font-bold ${
                timeLeft <= 30 ? "text-red-600" : "text-green-600"
              }`}
            >
              {Math.floor(timeLeft / 60)}:
              {String(timeLeft % 60).padStart(2, "0")}
            </p>
            <CircularProgress
              variant="determinate"
              value={progressPercentage}
              color={progressColor}
            />
          </div>
          <p className="text-2xl font-bold p-4 sticky top-0 z-10">
            Questions List
          </p>
          <div className="p-4 h-[calc(65%-56px)] overflow-y-auto">
            <ul className="space-y-2">
              {Array.from({ length: questions.length }).map((_, index) => (
                <li
                  key={index}
                  className={`p-3 rounded-md flex justify-between items-center ${
                    index === queno ? "bg-blue-100" : "bg-gray-100"
                  } hover:bg-gray-200 ${
                    interactedQuestions.has(index)
                      ? "cursor-pointer"
                      : "opacity-50 pointer-events-none"
                  }`}
                  data-index={index.toString()}
                  onClick={handleQuestionClick}
                >
                  <span>Quiz question {index + 1}</span>
                  <span className="text-green-600">
                    {interactedQuestions.has(index) ? "✔" : "◌"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <CustomSnackbar
          open={snackbarOpen}
          onClose={handleCloseSnackbar}
          message={errorMessage || "Answer submitted successfully!"}
          severity={snackbarStatus}
        />
        <AlertDialog
          open={dialogOpen}
          title={
            dialogMode === "warning"
              ? "Submit Answer"
              : "Confirm Exam Submission"
          }
          content={
            dialogMode === "warning"
              ? "Please select an answer before proceeding."
              : "Are you sure you want to submit the exam?"
          }
          agreeText={dialogMode === "warning" ? "Select Answer" : "Submit"}
          disagreeText={dialogMode === "confirmation" ? "Cancel" : ""}
          onAgree={
            dialogMode === "confirmation"
              ? handleConfirmSubmit
              : handleDialogClose
          }
          onClose={handleDialogClose}
        />
        <AlertDialog
          open={fullscreenDialogOpen}
          title="Enter Fullscreen?"
          content="To ensure a distraction-free environment, we recommend entering fullscreen. Do you want to proceed?"
          agreeText="Yes, Go Fullscreen"
          disagreeText=""
          onAgree={handleFullscreenConfirm}
          onDisagree={handleDialogClose}
          onClose={handleDialogClose}
        />
        <AlertDialog
          open={switchTabDialogOpen}
          title="⚠️Warning: Tab Switch Detected"
          content="You have switched tabs during the exam. If you switch tabs again, you will be disqualified from the exam!"
          agreeText="Continue Exam"
          disagreeText="Cancel"
          onAgree={handleContinueExam}
          onClose={handleTabSwitchClose}
        />
      </div>
    </div>
  );
}
