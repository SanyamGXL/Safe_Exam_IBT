#########################################################################################
import sys
import os
import socket
import time
import datetime
import win32api
from scapy.all import sniff, IP, UDP
import psutil
from predictor import ModelPredictor
import requests
from threading import Timer
import json
import sys
import requests
import json
import socket
import subprocess
import ctypes


def is_admin():
    """Check if the script is running with administrator privileges."""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except:
        return False

def run_as_admin():
    """Re-run the script as administrator if not already elevated."""
    if not is_admin():
        script = os.path.abspath(sys.argv[0])
        params = " ".join([f'"{arg}"' for arg in sys.argv[1:]])
        
        try:
            subprocess.run(["powershell", "Start-Process", "python", f"'{script}' {params}", "-Verb", "RunAs"], check=True)
        except subprocess.CalledProcessError:
            print("Failed to elevate to admin privileges. Please run manually as administrator.")
        sys.exit()

def register_protocol():
    """Runs the batch file to register the protocol in Windows Registry."""
    script_path = os.path.join(os.getcwd(), "register_protocol.bat")
    
    if os.path.exists(script_path):
        subprocess.run(["cmd", "/c", script_path], shell=True)
    else:
        print("Error: register_protocol.bat not found.")



def open_browser():
    """Open Chrome with the required URL."""
    url = "http://localhost:3000"
    try:
        subprocess.Popen(["cmd", "/c", "start", "chrome", url], shell=True)
    except Exception as e:
        print(f"Failed to open browser: {e}")

def get_ip_address():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            return sock.getsockname()[0]
    except socket.error as e:
        print(f"Error occurred: {e}")
        return None
    
def register_protocol():
    script_path = os.path.join(os.getcwd(), "register_protocol.bat")
    subprocess.run(["cmd", "/c", script_path], shell=True)



class PacketMonitor:
    def __init__(self):
        self.traffic_dict = {}
        self.program_start_time = time.time()
        self.deviceIP = self.get_ip_address()
        self.initial_display_devices = self.get_display_devices()
        self.all_ip_address = self.get_all_ip_addresses()
        current_time = datetime.datetime.now()
        current_time = current_time.strftime("%Y-%m-%d-%H-%M-%S")
        self.suspicious_transaction_count = 0
        self.metadata_path = os.path.join(os.path.abspath(os.path.join(os.getcwd(), "..")), "Metadata")
        
        self.api_url_blockchain = "http://127.0.0.1:3333/write_to_blockchain"
        
        self.message = "yes"
        self.student_json_data = {
            "student_id": "-",
            # "wallet_address":"-",
            "exam_title": "-",
            "city": "-",
            "center_name": "-",
            "booklet": "-",
            "start_time": current_time,
            "que_ans": "-",
            "suspicious_activity_detected": f"{self.message}-{self.deviceIP}",
            "end_time": "-",
            # "transaction_id": "-",
        }

        try:
            with open("registered_user.json" , "r") as f:
                # This will contain private_key, app_id etc of user who has already deployed the application
                self.user_json_data = json.load(fp=f)

                # Update the json for studnet ID and wallet address
                self.student_json_data['student_id'] = self.user_json_data['student_id']
                f.close()
                
        except Exception as e :
            print(str(e))

        self.predictor_obj = ModelPredictor()
        self.monitoring_interval = 15
        self.monitoring_timer = None

    def get_ip_address(self):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
                sock.connect(("8.8.8.8", 80))
                return sock.getsockname()[0]
        except socket.error as e:
            print(f"Error occurred: {e}")
            return None

    def create_filter_string(self, ip_addresses):
        if not ip_addresses:
            return ""
        return " or ".join(f"host {ip}" for ip in ip_addresses)

    def get_all_ip_addresses(self):
        ip_addresses = []
        interfaces = psutil.net_if_addrs()
        for addresses in interfaces.values():
            for address in addresses:
                if address.family == socket.AF_INET:
                    ip_addresses.append(address.address)
        return ip_addresses

    def get_display_devices(self):
        display_devices = []
        i = 0
        while True:
            try:
                display_device = win32api.EnumDisplayDevices(None, i)
                if display_device.DeviceName:
                    display_devices.append(display_device)
                i += 1
            except win32api.error:
                break
        return display_devices

    def check_display_changes(self):
        current_display_devices = self.get_display_devices()
        if len(current_display_devices) > len(self.initial_display_devices):
            print("Malicious activity detected: Display devices changed.")
            self.suspicious_transaction_count += 1
            requests.post(url=self.api_url_blockchain, json=self.student_json_data)
            
            # If User is caught cheating more than 5 time then stop writing transactions 
            if self.suspicious_transaction_count > 3:
                sys.exit(0)

    def process_packet(self, packet):
        # Added For limiting resource consumption by the script and making GUI more responsive #
        # time.sleep(1)



        try:
            if self.suspicious_transaction_count > 3 :
                sys.exit(0)
            if IP in packet and UDP in packet:
                src_ip = packet[IP].src
                dst_ip = packet[IP].dst
                packet_length = len(packet[UDP])

                if dst_ip not in self.traffic_dict:
                    self.traffic_dict[dst_ip] = {"starttime": time.time(), "packet_rate": 0}
                    print(f"Connection started between {self.deviceIP} - {dst_ip}")

                elapsed_time = time.time() - self.traffic_dict[dst_ip]['starttime']
                if elapsed_time > 0:
                    self.traffic_dict[dst_ip]['packet_rate'] += packet_length / elapsed_time

                if time.time() - self.program_start_time > self.monitoring_interval:
                    self.program_start_time = time.time()
                    self.check_packet_rates()
        except Exception as e:
            print("Error occurred while processing packets: ", e)

    def check_packet_rates(self):
        print("Traffic dictionary: ", self.traffic_dict)
        for key, value in self.traffic_dict.items():
            packet_rate = value['packet_rate']
            if packet_rate > 245368:
                print("High packet rate detected, sending data for AI prediction.")
                data_for_prediction = {
                    'protocol': 'UDP',
                    'packet_length': packet_rate,
                    'flag': 0,
                    'sequence': 0,
                    'window_size': 0,
                    'ack': 0
                }
                if self.predictor_obj.predict(data_for_prediction) != 1:
                    print("Malicious activity detected!")
                    self.suspicious_transaction_count+=1
                    requests.post(url=self.api_url_blockchain, json=self.student_json_data)
                    
                    # If User is caught cheating more than 5 time then stop writing transactions 
                    if self.suspicious_transaction_count > 3:
                        sys.exit(0)

                    # Delay after sending request to server so that both AI model and server gets time to load resources #
                    time.sleep(15)
                else:
                    print("Not a malicious activity")
        self.traffic_dict.clear()

    def start_monitoring(self):
        self.check_display_changes()  # Initial check for display changes
        self.monitoring_timer = Timer(self.monitoring_interval, self.start_monitoring)
        self.monitoring_timer.start()

    def main(self):
        print("Wireless AI model monitoring enabled!")
        print("Device IP address:", self.deviceIP)
        print("All IP addresses: ", self.all_ip_address)

        filter_string = self.create_filter_string(self.all_ip_address) if self.all_ip_address else f"host {self.deviceIP}"
        try:
            sniff(filter=filter_string, prn=self.process_packet, store=0)
        except KeyboardInterrupt:
            print("Exiting loop")
        finally:
            if self.monitoring_timer:
                self.monitoring_timer.cancel()

if __name__ == "__main__":
    run_as_admin()  # Ensures script runs with admin privileges
    register_protocol()
    monitor = PacketMonitor()
    monitor.start_monitoring()  # Start monitoring packets
    monitor.main()
    open_browser()  # Open browser after registration