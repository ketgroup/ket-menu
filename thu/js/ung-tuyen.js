(function () {
  "use strict";

  var MAX_BYTES = 5 * 1024 * 1024;
  var form = document.getElementById("apply-form");
  var input = document.getElementById("cv_file");
  var dropzone = document.getElementById("cv_dropzone");
  var card = document.getElementById("cv_file_card");
  var nameEl = document.getElementById("cv_file_name");
  var sizeEl = document.getElementById("cv_file_size");
  var removeBtn = document.getElementById("cv_file_remove");
  var submitBtn = document.getElementById("apply_submit");
  var subjectEl = document.getElementById("form_subject");

  if (!form || !input || !dropzone) return;

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function showError(msg) {
    window.alert(msg);
  }

  function validateFile(file) {
    if (!file) return true;
    if (file.size > MAX_BYTES) {
      showError("File CV vượt quá 5MB. Vui lòng chọn file nhỏ hơn.");
      return false;
    }
    return true;
  }

  function clearFile() {
    input.value = "";
    card.classList.remove("is-visible");
    dropzone.style.display = "";
  }

  function setFile(file) {
    if (!file) {
      clearFile();
      return;
    }
    if (!validateFile(file)) {
      clearFile();
      return;
    }
    nameEl.textContent = file.name;
    sizeEl.textContent = formatSize(file.size);
    card.classList.add("is-visible");
    dropzone.style.display = "none";
  }

  input.addEventListener("change", function () {
    setFile(input.files && input.files[0]);
  });

  removeBtn.addEventListener("click", function (e) {
    e.preventDefault();
    clearFile();
  });

  ["dragenter", "dragover"].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) {
      e.preventDefault();
      dropzone.classList.add("is-dragover");
    });
  });

  ["dragleave", "drop"].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) {
      e.preventDefault();
      dropzone.classList.remove("is-dragover");
    });
  });

  dropzone.addEventListener("drop", function (e) {
    var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    input.files = e.dataTransfer.files;
    setFile(file);
  });

  dropzone.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input.click();
    }
  });

  function updateSubject() {
    if (!subjectEl) return;
    var name = (document.getElementById("full_name").value || "").trim();
    var pos = (document.getElementById("position").value || "").trim();
    var venue = (document.getElementById("venue").value || "").trim();
    subjectEl.value =
      "Ứng tuyển Kết Group · " + pos + " · " + venue + " · " + name;
  }

  form.addEventListener("submit", function (e) {
    var file = input.files && input.files[0];
    if (file && !validateFile(file)) {
      e.preventDefault();
      return;
    }
    updateSubject();
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Đang gửi…";
    }
  });
})();
