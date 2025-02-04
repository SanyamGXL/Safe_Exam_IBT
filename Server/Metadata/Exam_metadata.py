
import os
import json

Exam_title = "UPSC"
City = "Delhi"
Center = "AIU"
booklet = "A"
Exam_start_time = None
Exam_End_time = None


question_paper_dir = "Multisign_question_paper/question_paper.json"
if os.path.exists(question_paper_dir):
    with open(question_paper_dir , "r") as f:
        question_paper = json.load(fp=f)

else:
    question_paper = [] # That means multisign transaction is not found
