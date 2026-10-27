(function () {
  "use strict";

  var MAX_BYTES = 5 * 1024 * 1024;
  var form = document.getElementById("apply-form");
  var input = document.getElementById("cv_file");
  var nameEl = document.querySelector("[data-file-name]");
  if (!form || !input) return;

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

  input.addEventListener("change", function () {
    var file = input.files && input.files[0];
    if (!file) {
      if (nameEl) nameEl.textContent = "Chưa chọn file";
      return;
    }
    if (!validateFile(file)) {
      input.value = "";
      if (nameEl) nameEl.textContent = "Chưa chọn file";
      return;
    }
    if (nameEl) nameEl.textContent = file.name;
  });

  form.addEventListener("submit", function (e) {
    var file = input.files && input.files[0];
    if (file && !validateFile(file)) {
      e.preventDefault();
    }
  });
})();
