"use client";
import Button from "@mui/material/Button";
import React, { useEffect } from "react";
import { useState } from "react";
import AlertDialog from "../common/DialogBox";

export default function QuizPage() {
  const [queno, setQueno] = useState(0);
  const [que, setQue] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [interactedQuestions, setInteractedQuestions] = useState<Set<number>>(
    new Set([0])
  );
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(
    Array(14).fill(-1)
  );
  const que_array = [
    {
      que: "What is the capital of France?",
      options: ["Paris", "London", "Berlin", "Rome"],
    },
    {
      que: "Which planet is known as the Red Planet?",
      options: ["Mars", "Venus", "Jupiter", "Saturn"],
    },
    {
      que: "What is the largest mammal?",
      options: ["Blue Whale", "Elephant", "Giraffe", "Hippopotamus"],
    },
    {
      que: "Who wrote 'Hamlet'?",
      options: ["Shakespeare", "Hemingway", "Dickens", "Austen"],
    },
    {
      que: "What is the boiling point of water?",
      options: ["100°C", "90°C", "120°C", "80°C"],
    },
    {
      que: "Which is the smallest prime number?",
      options: ["2", "3", "1", "5"],
    },
    { que: "What is the square root of 64?", options: ["8", "7", "9", "6"] },
    {
      que: "What is the chemical symbol for gold?",
      options: ["Au", "Ag", "Fe", "Pb"],
    },
    {
      que: "Who painted the Mona Lisa?",
      options: ["Leonardo da Vinci", "Van Gogh", "Picasso", "Michelangelo"],
    },
    {
      que: "What is the largest desert in the world?",
      options: ["Sahara", "Arctic", "Gobi", "Kalahari"],
    },
    {
      que: "Which gas do plants absorb?",
      options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"],
    },
    {
      que: "What is the capital of Japan?",
      options: ["Tokyo", "Kyoto", "Osaka", "Nagoya"],
    },
    {
      que: "What is the currency of the United States?",
      options: ["Dollar", "Euro", "Pound", "Yen"],
    },
    { que: "How many continents are there?", options: ["7", "6", "5", "8"] },
  ];
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const load_que_option = () => {
    if (queno >= 0 && queno < que_array.length) {
      setQue(que_array[queno].que);
      setOptions(que_array[queno].options);
    } else {
      setQue(
        "Login to start your exam with confidence. Your information is handled with the utmost care and securely stored to ensure it stays safe and protected every step of the way"
      );
      setOptions([]);
    }
  };

  const next_page = () => {
    if (selectedAnswers[queno] === -1) {
      setDialogOpen(true); 
      return;
    }
    if (queno < que_array.length - 1) {
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

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  useEffect(() => {
    load_que_option();
  }, [queno]);

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
            <p className="mb-6 text-xl">{que}</p>
            <div className="space-y-4">
              {options.map((option, index) => (
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
              onClick={next_page}
              disabled={queno === que_array.length - 1}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="m-4 w-[20%] h-[95%] shadow-2xl rounded-lg">
          <p className="text-2xl font-bold p-4 sticky top-0 z-10">
            Questions List
          </p>
          <div className="p-4 h-[calc(95%-56px)] overflow-y-auto">
            <ul className="space-y-2">
              {Array.from({ length: que_array.length }).map((_, index) => (
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
        <AlertDialog
          open={dialogOpen}
          title="Submit Answer"
          content="Please select answer before going furture."
          agreeText="Select Answer"
          disagreeText=""
          onDisagree={handleDialogClose}
          onClose={handleDialogClose}
        />
      </div>
    </div>
  );
}
