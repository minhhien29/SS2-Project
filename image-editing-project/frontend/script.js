const imageInput = document.getElementById("imageInput");
const promptInput = document.getElementById("promptInput");
const editBtn = document.getElementById("editBtn");
const originalPreview = document.getElementById("originalPreview");
const editedPreview = document.getElementById("editedPreview");
const downloadLink = document.getElementById("downloadLink");
const statusText = document.getElementById("statusText");

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    originalPreview.src = URL.createObjectURL(file);
    editedPreview.src = "";
    downloadLink.href = "#";
    statusText.textContent = "Image selected successfully.";
  }
});

editBtn.addEventListener("click", async () => {
  const imageFile = imageInput.files[0];
  const prompt = promptInput.value.trim();

  if (!imageFile) {
    alert("Please upload an image.");
    return;
  }

  if (!prompt) {
    alert("Please enter a prompt.");
    return;
  }

  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("prompt", prompt);

  statusText.textContent = "Processing image...";

  try {
    const response = await fetch("http://127.0.0.1:5000/edit", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      statusText.textContent = data.error || "Failed to process image.";
      return;
    }

    editedPreview.src = data.edited_image_url;
    downloadLink.href = data.edited_image_url;
    statusText.textContent = "Image edited successfully.";
  } catch (error) {
    console.error(error);
    statusText.textContent = "An error occurred while connecting to the server.";
  }
});