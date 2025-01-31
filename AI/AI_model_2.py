#########################################################################################
import sys
import os
# Add the parent directory to the system path so that metadata files can be imported
parent_dir = os.path.abspath(os.path.join(os.getcwd(), ".."))
sys.path.append(parent_dir)
from Metadata import metadata
#########################################################################################
import wmi
import time
import pythoncom
import requests
import socket
import json
import datetime
import sys


class ScreenCastingMonitor:
    def __init__(self):
        self.c = None
        self.initialize_com()
        self.c = wmi.WMI()
        self.initial_monitors = self.get_connected_monitors()
        self.initial_count = len(self.initial_monitors)
        self.deviceIP = self.get_ip_address()
        self.message = "yes"

        current_time = datetime.datetime.now()
        current_time = current_time.strftime("%Y-%m-%d-%H-%M-%S")

        self.api_url_blockchain = metadata.server_URL + metadata.insert_data_endpoint

        self.suspicious_transaction_count = 0

        self.metadata_path = os.path.join(os.path.abspath(os.path.join(os.getcwd(), "..")), "Metadata")

        self.student_json_data = {
            "student_id": "-",
            "wallet_address":"-",
            "exam_title": metadata.Exam_Title,
            "city": "-",
            "center_name": "-",
            "booklet": metadata.Booklet,
            "start_time": current_time,
            "que_ans": "-",
            "suspicious_activity_detected": f"{self.message}-{self.deviceIP}",
            "end_time": "-",
            "transaction_id": "-",
        }

        try:

            with open(self.metadata_path+"/deployed_user_data.json" , "r") as f:
                # This will contain private_key, app_id etc of user who has already deployed the application
                self.user_json_data = json.load(fp=f)

                # Update the json for studnet ID and wallet address
                self.student_json_data['student_id'] = self.user_json_data['userID']
                self.student_json_data['wallet_address'] =self.user_json_data['user_wallet_address']
                f.close()


            with open(self.metadata_path+"/city_center.json" , "r") as  file:
                city_center_json = json.load(fp=file)
                
                self.student_json_data['city'] = city_center_json['city']
                self.student_json_data['center_name'] = city_center_json['center']
        except Exception as e :
            print(str(e))

    def get_ip_address(self):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
                sock.connect(("8.8.8.8", 80))  # Connect to a dummy socket 
                local_ip_address = sock.getsockname()[0]
            return local_ip_address
        except socket.error as e:
            print(f"Error occurred: {e}")
            return None

    def initialize_com(self):
        """Initialize COM for the current thread.""" 
        pythoncom.CoInitialize()

    def get_connected_monitors(self):
        monitors = self.c.Win32_PnPEntity(ConfigManagerErrorCode=0)
        connected_monitors = []

        for monitor in monitors:
            if 'DISPLAY' in monitor.PNPDeviceID:
                instance_name = monitor.PNPDeviceID
                description = monitor.Description
                connection_type = "Unknown"

                # Check if the monitor is connected via HDMI, DVI, DisplayPort, or VGA
                if "HDMI" in instance_name.upper():
                    connection_type = "HDMI"
                elif "DVI" in instance_name.upper():
                    connection_type = "DVI"
                elif "DISPLAYPORT" in instance_name.upper():
                    connection_type = "DisplayPort"
                elif "VGA" in instance_name.upper():
                    connection_type = "VGA"

                connected_monitors.append((instance_name, description, connection_type))

        return connected_monitors

    def detect_screen_casting(self):
        while True:


            if self.suspicious_transaction_count > 3:
                sys.exit(0)

            current_monitors = self.get_connected_monitors()
            current_count = len(current_monitors)

            if current_count != self.initial_count:
                print("Display configuration changed!")
                
                # Update JSON data with the latest IP address
                self.student_json_data["suspicious_activity_detected"] = f"{self.message}-{self.deviceIP}"

                # Send POST request
                requests.post(url=self.api_url_blockchain, json=self.student_json_data)

                if current_count > self.initial_count:
                    print("Screen casting detected.")
                else:
                    print("Screen casting stopped.")

                # Update the state to the current configuration
                self.initial_monitors = current_monitors
                self.initial_count = current_count
            else:
                print("Display configuration is stable.")

            time.sleep(0.1)

    def main(self):
        print("Wired AI model monitoring enabled!")
        try:
            self.detect_screen_casting()
        finally:
            pythoncom.CoUninitialize()

if __name__ == "__main__":
    monitor = ScreenCastingMonitor()
    monitor.main()