"use client";
import Button from "@mui/material/Button";
import React, { useEffect } from "react";
import { useState } from "react";
import AlertDialog from "../common/DialogBox";
import { QuestionPaperUrl } from "../apiUrl/page";
import CustomSnackbar from "../common/SnackBar";
import { useRouter } from "next/navigation";

interface QuestionPaper {
  que: String;
  options: String[];
}

export default function QuizPage() {
  const [queno, setQueno] = useState(0);
  const [questions, setQuestions] = useState<QuestionPaper[]>([]);
  const [interactedQuestions, setInteractedQuestions] = useState<Set<number>>(
    new Set([0])
  );
  const [dialogMode, setDialogMode] = useState<"warning" | "confirmation">(
    "warning"
  );
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarStatus, setSnackbarStatus] = useState<"success" | "error">(
    "success"
  );
  const router = useRouter();
  const handleCloseSnackbar = () => setSnackbarOpen(false);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(QuestionPaperUrl,{
        method: "POST",
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
      const data: QuestionPaper[] = await response.json();
      setQuestions(data);
      setSelectedAnswers(Array(data.length).fill(-1));
      setLoading(false);
    } catch (error) {
      setErrorMessage(`Error fetching questions: ${error}`);
      setSnackbarStatus("error");
      setSnackbarOpen(true);
      setLoading(false);
    }
  };

  const next_page = () => {
    if (selectedAnswers[queno] === -1) {
      setDialogMode("warning");
      setDialogOpen(true);
      return;
    }
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
    console.log("selected Option:",updatedAnswers)
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleSubmitExam = () => {
    setDialogMode("confirmation");
    setDialogOpen(true);
  };

  const handleConfirmSubmit = () => {
    setDialogOpen(false);
    console.log("Submitted Answers:", selectedAnswers); 
    router.push("/LastPage");
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const currentQuestion = questions[queno];
  
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
              {queno === questions.length - 1? "Submit Exam":"Next"}
            </Button>
          </div>
        </div>

        <div className="m-4 w-[20%] h-[95%] shadow-2xl rounded-lg">
          <p className="text-2xl font-bold p-4 sticky top-0 z-10">
            Questions List
          </p>
          <div className="p-4 h-[calc(95%-56px)] overflow-y-auto">
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
          message={errorMessage || "Questions loaded successfully!"}
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
            dialogMode === "confirmation" ? handleConfirmSubmit : handleDialogClose
          }
          onClose={handleDialogClose}
        />
      </div>
    </div>
  );
}
