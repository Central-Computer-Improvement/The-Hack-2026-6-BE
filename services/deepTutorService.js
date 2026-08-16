const FormData = require("form-data");

const getBaseUrl = () => {
  return process.env.DEEPTUTOR_API_URL || "http://127.0.0.1:8001/api/v1";
};

/**
 * Generic API request helper to DeepTutor Python microservice
 */
async function apiRequest(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.detail || data?.message || `DeepTutor request failed with status ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.cause?.code === "ECONNREFUSED" || err.code === "ECONNREFUSED") {
      const connErr = new Error("DeepTutor AI microservice is not reachable at " + baseUrl + ". Please ensure it is running.");
      connErr.status = 503;
      throw connErr;
    }
    throw err;
  }
}

// ============================================================
// Roadmap Microservice
// ============================================================
exports.generateRoadmap = async (topic) => {
  return apiRequest("/roadmap/generate", {
    method: "POST",
    body: JSON.stringify({ topic }),
  });
};

// ============================================================
// Course Tracking & Memory Pipeline
// ============================================================
exports.trackVideo = async (courseId, payload) => {
  return apiRequest(`/courses/${courseId}/track_video`, {
    method: "POST",
    body: JSON.stringify({
      video_id: payload.video_id,
      title: payload.title,
      kb_tags: payload.kb_tags || [],
      kb_concepts: payload.kb_concepts || [],
    }),
  });
};

exports.evaluateQuiz = async (courseId, payload) => {
  return apiRequest(`/courses/${courseId}/quiz/evaluate`, {
    method: "POST",
    body: JSON.stringify({
      question_id: payload.question_id,
      question_type: payload.question_type,
      student_answer: payload.student_answer,
      expected_answer: payload.expected_answer || null,
      rubric: payload.rubric || null,
      misconceptions: payload.misconceptions || null,
    }),
  });
};

exports.completeModule = async (courseId, moduleId, payload) => {
  return apiRequest(`/courses/${courseId}/modules/${moduleId}/complete`, {
    method: "POST",
    body: JSON.stringify({
      module_id: moduleId,
      module_title: payload.module_title,
      learned_concepts: payload.learned_concepts || [],
      misconceptions: payload.misconceptions || [],
      essay_feedback: payload.essay_feedback || "",
    }),
  });
};

exports.resetCourse = async (courseId) => {
  return apiRequest(`/courses/${courseId}/reset`, {
    method: "POST",
  });
};

// ============================================================
// Knowledge Base (RAG) Subsystem
// ============================================================
exports.listKnowledgeBases = async () => {
  return apiRequest("/knowledge/list", { method: "GET" });
};

exports.createKnowledgeBase = async (kb_name) => {
  return apiRequest("/knowledge/create", {
    method: "POST",
    body: JSON.stringify({ kb_name }),
  });
};

exports.deleteKnowledgeBase = async (kb_name) => {
  return apiRequest(`/knowledge/${kb_name}`, { method: "DELETE" });
};

/**
 * Upload a document (PDF, DOCX, TXT) to a knowledge base.
 * @param {string} kb_name - Target knowledge base name
 * @param {object} file    - Multer file object ({ buffer, originalname, mimetype })
 */
exports.uploadDocument = async (kb_name, file) => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/knowledge/${encodeURIComponent(kb_name)}/documents/upload`;

  const form = new FormData();
  form.append("files", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
    knownLength: file.size,
  });

  const headers = {
    ...form.getHeaders(),
  };
  const token = process.env.DEEPTUTOR_AUTH_TOKEN;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: form,
      duplex: "half",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(
        data?.detail || data?.message || `DeepTutor upload failed: ${res.status}`
      );
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (err) {
    if (err.cause?.code === "ECONNREFUSED" || err.code === "ECONNREFUSED") {
      const connErr = new Error(
        "DeepTutor AI microservice is not reachable at " + baseUrl
      );
      connErr.status = 503;
      throw connErr;
    }
    throw err;
  }
};

// ============================================================
// Model Settings & 3-Layer Memory
// ============================================================
exports.getModelCatalog = async () => {
  return apiRequest("/settings/catalog", { method: "GET" });
};

exports.updateModelCatalog = async (catalog) => {
  return apiRequest("/settings/catalog", {
    method: "PUT",
    body: JSON.stringify(catalog),
  });
};

exports.getMemoryDoc = async (layer, key) => {
  return apiRequest(`/memory/doc/${layer}/${key}`, { method: "GET" });
};

exports.resetMemoryDoc = async (layer, key) => {
  return apiRequest(`/memory/doc/${layer}/${key}/reset`, { method: "POST" });
};
