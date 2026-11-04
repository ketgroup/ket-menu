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
    var EP = window.KET_FORM_ENDPOINT || "";
    if (!EP) { if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Đang gửi…"; } return; } // dự phòng: form cũ
    e.preventDefault();
    function v(id) { var el = document.getElementById(id); return el ? (el.value || "").trim() : ""; }
    var f = { ho_ten: v("full_name"), so_zalo: v("phone"), nam_sinh: v("birth_year"), quan: v("venue"), vi_tri: v("position"), thoi_gian: v("schedule"), kinh_nghiem: v("experience"), link_cv: v("profile_link") };
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Đã gửi ✓"; }
    var done = false;
    function go() { if (done) return; done = true; location.href = "ung-tuyen-thanh-cong.html"; }
    function post(body, mode) { return fetch(EP, { method: "POST", mode: mode, redirect: "follow", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: body }); }
    function run(body, n) {
      post(body, "cors").then(function (r) { return r.json(); }, function () { return post(body, "no-cors"); })
        .then(go, function () {
          if (n < 3) return setTimeout(function () { run(body, n + 1); }, [3000, 10000, 30000][n]);
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Gửi lại"; }
          showError("Mạng lỗi, chưa gửi được. Vui lòng bấm Gửi lại hoặc nhắn Zalo cho quán.");
        });
    }
    function start(fileObj) { run(JSON.stringify({ form: "ung-tuyen", f: f, file: fileObj }), 0); }
    if (file) { var rd = new FileReader(); rd.onload = function () { start({ name: file.name, type: file.type, data: String(rd.result).split(",")[1] }); }; rd.onerror = function () { start(null); }; rd.readAsDataURL(file); }
    else start(null);
  });
})();
