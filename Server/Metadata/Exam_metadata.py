
import os
import json
import datetime

Exam_title = "MPSC"
City = "Mumbai"
Center = "Jeeto University"
booklet = "b"
Exam_start_time = datetime.datetime.now()
Exam_End_time = Exam_start_time + datetime.timedelta(seconds=120)

question_paper_dir = "Multisign_question_paper/question_paper.json"
if os.path.exists(question_paper_dir):
    with open(question_paper_dir , "r") as f:
        question_paper = json.load(fp=f)

else:
    question_paper = [] # That means multisign transaction is not found

total_questions = len(question_paper)


