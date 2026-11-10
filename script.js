const API_URL = "https://mental-health-score-predictor-ymmp.onrender.com";

const form = document.getElementById("prediction-form");
const submitButton = document.getElementById("submit-button");
const buttonLabel = submitButton.querySelector(".button-label");
const errorMessage = document.getElementById("error-message");
const resultPlaceholder = document.getElementById("result-placeholder");
const resultContent = document.getElementById("result-content");
const resultStatus = document.getElementById("result-status");
const scoreValue = document.getElementById("score-value");

function showError(message, details = []) {
  errorMessage.replaceChildren();
  const messageText = document.createElement("div");
  messageText.textContent = message;
  errorMessage.appendChild(messageText);

  if (details.length) {
    const list = document.createElement("ul");
    details.forEach((detail) => {
      const item = document.createElement("li");
      item.textContent = detail;
      list.appendChild(item);
    });
    errorMessage.appendChild(list);
  }
  errorMessage.hidden = false;
}

function formatValidationErrors(detail) {
  if (!Array.isArray(detail)) return [];
  return detail.map((issue) => {
    const field = Array.isArray(issue.loc) ? issue.loc.slice(1).join(" → ") : "Input";
    return `${field || "Input"}: ${issue.msg || "Invalid value"}`;
  });
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.classList.toggle("loading", isLoading);
  buttonLabel.textContent = isLoading ? "Generating your score..." : "Generate my score";
}

function getPayload() {
  const values = new FormData(form);
  return {
    Age: Number(values.get("Age")),
    Gender: values.get("Gender"),
    Country: values.get("Country").trim(),
    Academic_Level: values.get("Academic_Level"),
    Most_Used_Platform: values.get("Most_Used_Platform"),
    Purpose_Of_Use: values.get("Purpose_Of_Use"),
    Avg_Daily_Usage_Hours: Number(values.get("Avg_Daily_Usage_Hours")),
    Daily_Unlocks: Number(values.get("Daily_Unlocks")),
    Study_Hours: Number(values.get("Study_Hours")),
    Physical_Activity_Hours: Number(values.get("Physical_Activity_Hours")),
    Sleep_Hours_Per_Night: Number(values.get("Sleep_Hours_Per_Night")),
    Stress_Level: values.get("Stress_Level")
  };
}

function showResult(score) {
  scoreValue.textContent = Number(score).toFixed(2);
  resultPlaceholder.hidden = true;
  resultContent.hidden = false;
  resultStatus.textContent = "PREDICTION READY";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.hidden = true;

  if (!form.reportValidity()) return;

  const payload = getPayload();
  setLoading(true);
  resultStatus.textContent = "PROCESSING";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch {
      throw new Error("The API returned an unreadable response. Please try again.");
    }

    if (!response.ok) {
      if (response.status === 422) {
        const issues = formatValidationErrors(responseData.detail);
        showError("Please check the following fields:", issues);
        throw new Error("Please correct the highlighted input values.");
      }
      const apiMessage = typeof responseData.detail === "string"
        ? responseData.detail
        : `The API request failed (HTTP ${response.status}).`;
      throw new Error(apiMessage);
    }

    if (typeof responseData.predicted_mental_health_score !== "number") {
      throw new Error("The API response did not contain a valid predicted score.");
    }

    showResult(responseData.predicted_mental_health_score);
  } catch (error) {
    resultStatus.textContent = "REQUEST FAILED";
    if (!errorMessage.hidden) {
      // Keep the field-level validation details already displayed.
    } else if (error instanceof TypeError) {
      showError("Could not connect to the prediction API. Make sure FastAPI is running at http://127.0.0.1:8000 and try again.");
    } else {
      showError(error.message || "Something went wrong. Please try again.");
    }
  } finally {
    setLoading(false);
  }
});
