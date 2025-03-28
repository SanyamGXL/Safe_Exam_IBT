import requests
from Metadata import Blockchain_Metadata , Exam_metadata
import base64
from models import Student , Exam_Data
from app import create_app , db
import datetime
from sqlalchemy import func , distinct


app = create_app()


with app.app_context():
    city_wise_suspicious_count = (
        db.session.query(
            Exam_Data.city,  
            func.count(distinct(Exam_Data.student_id))  
        )
        .filter(Exam_Data.suspicious_activity.like("yes%"))  
        .group_by(Exam_Data.city)  
        .all()
    )

    for city, count in city_wise_suspicious_count:
        print(f"City: {city}, Suspicious Students: {count}")