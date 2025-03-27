const dataUrl = "http://127.0.0.1:2222/get_all_quiz_data";
const dummyUrl = "http://127.0.0.1:2222/get_all_quiz_dummy_data";
export const anomalyUrl = "http://127.0.0.1:2222/get_suspicious_user_count"
export const citywiseUrl = "http://127.0.0.1:2222/get_citywise_count"
export const centerwiseUrl = "http://127.0.0.1:2222/get_centerwise_count"

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
