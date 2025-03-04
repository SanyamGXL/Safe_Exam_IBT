const baseUrl = "https://f113-2405-201-200a-f0a7-2541-7fbf-5717-1bd3.ngrok-free.app/";

interface ApiEndpoints {
  LoginUrl: string;
  ExamMetadata: string;
  WriteBlockchain: string;
  SendRegistrationJson: string;
  SetupEXE: string;
}

export const API_URLS: ApiEndpoints = {
  LoginUrl: `${baseUrl}login`,
  ExamMetadata: `${baseUrl}get_exam_metadata`,
  WriteBlockchain: `${baseUrl}write_to_blockchain`,
  SendRegistrationJson:`${baseUrl}send_registration_json`,
  SetupEXE:`${baseUrl}send_setup_exe`
};
