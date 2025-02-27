const baseUrl = "https://93be-2409-40c0-2040-1c89-5937-ea24-98aa-fa22.ngrok-free.app/";

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
