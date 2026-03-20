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
    setStatus("Đã chọn ảnh: " + file.name, "");
  }
});

function setStatus(message, type) {
  statusText.textContent = message;
  statusText.className = "status " + type;
}

editBtn.addEventListener("click", async () => {
  const imageFile = imageInput.files[0];
  const prompt = promptInput.value.trim();

  if (!imageFile) {
    alert("Vui lòng upload ảnh.");
    return;
  }

  if (!prompt) {
    alert("Vui lòng nhập câu lệnh chỉnh sửa.");
    return;
  }

  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("prompt", prompt);

  // Trạng thái đang xử lý
  editBtn.disabled = true;
  editBtn.textContent = "⏳ Đang xử lý...";
  setStatus("🤖 AI đang phân tích ảnh và prompt của bạn...", "loading");

  try {
   const response = await fetch("http://127.0.0.1:5000/edit", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus("❌ Lỗi: " + (data.error || "Không thể xử lý ảnh."), "error");
      return;
    }

    editedPreview.src = data.edited_image_url;
    downloadLink.href = data.edited_image_url;
    setStatus("✅ Chỉnh sửa thành công!", "success");

  } catch (error) {
    console.error(error);
    setStatus("❌ Không thể kết nối tới server. Hãy chắc chắn Flask đang chạy.", "error");
  } finally {
    editBtn.disabled = false;
    editBtn.textContent = "🚀 Edit với AI";
  }
});