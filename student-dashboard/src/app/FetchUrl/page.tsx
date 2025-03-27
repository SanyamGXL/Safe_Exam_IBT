const baseUrl = "https://f04b-2405-201-200a-f0a7-c98c-c0bb-dc17-e34b.ngrok-free.app/"
const dataUrl = `${baseUrl}get_all_quiz_data`
const dummyUrl = `${baseUrl}get_all_quiz_dummy_data`
export const anomalyUrl = `${baseUrl}get_suspicious_user_count`
export const citywiseUrl = `${baseUrl}get_citywise_count`
export const centerwiseUrl = `${baseUrl}get_centerwise_count`
export const examMetadataUrl = `${baseUrl}get_exam_metadata`
export const getWalletDataUrl = `${baseUrl}get_wallet_data`
export const getWalletDataDummyUrl = `${baseUrl}get_dummy_wallet_data`

export const fetchData = async (dataType: string) => {
  try {
    const selectedUrl = dataType === "dummy" ? dummyUrl : dataUrl;
    const response = await fetch(selectedUrl, {
      method: "GET",
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return { error: "Failed to fetch data" }; 
  }
};

export default fetchData;
